import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Mail, Trash2, Crown, BadgeCheck, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'owner' | 'manager' | 'worker';
  joinedAt: number;
}

interface Invitation {
  id: string;
  email: string;
  role: 'manager' | 'worker';
  status: 'pending' | 'accepted';
  createdAt: number;
}

export function TeamManagement() {
  const { user, farmId, role, isPro } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'manager' | 'worker'>('worker');

  const isOwner = role === 'owner';

  useEffect(() => {
    if (farmId) {
      fetchTeamData();
    }
  }, [farmId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Members (from users where farmId = current)
      const q = query(collection(db, "users"), where("settings.profile.farmId", "==", farmId));
      const querySnapshot = await getDocs(q);
      const membersList: TeamMember[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const profile = data.settings?.profile;
        if (profile) {
          membersList.push({
            uid: docSnap.id,
            displayName: profile.displayName || "Sans nom",
            email: data.email || "N/A",
            role: profile.role || 'worker',
            joinedAt: profile.updatedAt || Date.now()
          });
        }
      });
      setMembers(membersList.sort((a, b) => b.joinedAt - a.joinedAt));

      // 2. Fetch Pending Invitations
      const invQ = query(collection(db, "invitations"), where("farmId", "==", farmId), where("status", "==", "pending"));
      const invSnapshot = await getDocs(invQ);
      const invList: Invitation[] = [];
      invSnapshot.forEach((docSnap) => {
        invList.push({ id: docSnap.id, ...docSnap.data() } as Invitation);
      });
      setInvitations(invList);
      
    } catch (err) {
      console.error("Error fetching team:", err);
      toast.error("Impossible de charger l'équipe.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    if (!inviteEmail.trim()) return;

    try {
      const inviteId = `${farmId}_${Date.now()}`;
      await setDoc(doc(db, "invitations", inviteId), {
        id: inviteId,
        farmId,
        email: inviteEmail.toLowerCase(),
        role: inviteRole,
        status: 'pending',
        createdAt: Date.now(),
        invitedBy: user?.uid
      });
      
      setInviteEmail("");
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      fetchTeamData();
    } catch (err) {
      toast.error("Échec de l'invitation.");
    }
  };

  const handleDeleteMember = async (targetUid: string) => {
    if (!isOwner || targetUid === user?.uid) return;
    if (confirm("Supprimer ce collaborateur de la ferme ?")) {
       try {
         // Mark user as having NO farm (or reset to their own UID)
         await updateDoc(doc(db, "users", targetUid, "settings", "profile"), {
           farmId: targetUid,
           role: 'owner'
         });
         toast.success("Membre supprimé.");
         fetchTeamData();
       } catch (err) {
         toast.error("Erreur lors de la suppression.");
       }
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await deleteDoc(doc(db, "invitations", id));
      toast.success("Invitation annulée.");
      fetchTeamData();
    } catch (err) {
      toast.error("Erreur lors de l'annulation.");
    }
  };

  if (!isPro) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold text-babs-brown tracking-tight">Mon Équipe</h2>
          <p className="text-babs-brown/60 font-medium uppercase tracking-widest text-[10px]">
             Collaboration & Rôles {isOwner ? "(Administration)" : "(Consultation)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Invitation Form (Owner only) */}
        <div className="lg:col-span-1">
           <div className={`bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 h-full ${!isOwner ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <UserPlus className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Inviter</h3>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Email du collaborateur</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                       <input 
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          className="w-full bg-gray-50 rounded-2xl py-4 pl-12 pr-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                          placeholder="exemple@mail.com"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Rôle attribué</label>
                    <select
                       value={inviteRole}
                       onChange={e => setInviteRole(e.target.value as any)}
                       className="w-full bg-gray-50 rounded-2xl py-4 px-4 font-bold text-babs-brown outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none text-sm"
                    >
                       <option value="worker">Employé (Production uniquement)</option>
                       <option value="manager">Manager (Production + Finances)</option>
                    </select>
                 </div>

                 <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-black rounded-2xl py-5 shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                 >
                    <BadgeCheck className="w-5 h-5" />
                    Envoyer l'invitation
                 </button>

                 <p className="text-[9px] text-gray-400 font-bold leading-relaxed text-center px-4">
                    Le collaborateur recevra une invitation à rejoindre la ferme **{farmId?.slice(-6)}** lors de sa prochaine connexion.
                 </p>
              </form>
           </div>
        </div>

        {/* Members & Pending List */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-50 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                       <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-babs-brown uppercase tracking-wider">Membres Actifs</h3>
                 </div>
                 <div className="px-3 py-1 bg-gray-100 rounded-full font-black text-[10px] text-gray-500">
                    {members.length} MEMBRE(S)
                 </div>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                   <Loader2 className="w-12 h-12 animate-spin text-babs-brown" />
                   <p className="text-xs font-black uppercase tracking-widest mt-4">Chargement de l'équipe...</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {/* Active Members */}
                   <div className="space-y-3">
                      {members.map(member => (
                        <div key={member.uid} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                                member.role === 'owner' ? 'bg-amber-100 text-amber-600' : 
                                member.role === 'manager' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                 {member.displayName[0].toUpperCase()}
                              </div>
                              <div>
                                 <p className="font-black text-babs-brown text-sm flex items-center gap-2">
                                    {member.displayName}
                                    {member.role === 'owner' && <Crown className="w-3 h-3 text-amber-500" />}
                                 </p>
                                 <p className="text-[10px] font-bold text-gray-400 capitalize">{member.role} • {member.email}</p>
                              </div>
                           </div>
                           
                           {isOwner && member.uid !== user?.uid && (
                              <button 
                                 onClick={() => handleDeleteMember(member.uid)}
                                 className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           )}
                        </div>
                      ))}
                   </div>

                   {/* Pending Invitations */}
                   {invitations.length > 0 && (
                     <div className="mt-12">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Invitations en attente</h4>
                        <div className="space-y-3">
                           {invitations.map(inv => (
                             <div key={inv.id} className="flex items-center justify-between p-4 bg-blue-50/20 border border-dashed border-blue-200 rounded-2xl transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-300">
                                      <Mail className="w-5 h-5" />
                                   </div>
                                   <div>
                                      <p className="font-bold text-babs-brown text-sm">{inv.email}</p>
                                      <p className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Rôle invité: {inv.role}</p>
                                   </div>
                                </div>
                                {isOwner && (
                                   <button 
                                      onClick={() => handleDeleteInvite(inv.id)}
                                      className="p-2 text-red-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                   >
                                      Annuler
                                   </button>
                                )}
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>

           {/* Permission Summary Card */}
           <div className={`bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex gap-4 ${isOwner ? '' : 'animate-pulse'}`}>
              <div className="p-3 bg-white rounded-2xl shadow-sm self-start">
                 <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                 <p className="font-black text-amber-800 text-xs">Note sur les Permissions</p>
                 <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed">
                   {isOwner ? 
                     "En tant que propriétaire, vous avez un accès complet aux finances et pouvez gérer l'équipe. Vos employés (Worker) ne voient que l'inventaire technique." :
                     "En tant que collaborateur, vos droits sont limités selon votre rôle. Contactez le propriétaire pour toute modification de permission."
                   }
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
