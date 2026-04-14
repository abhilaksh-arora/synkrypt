import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  email: string;
  name: string;
  global_role: string;
  org_role: 'owner' | 'admin' | 'member';
}

interface OrgCtx {
  orgs: Organization[];
  currentOrg: Organization | null;
  currentOrgRole: 'owner' | 'admin' | 'member' | null;
  loading: boolean;
  setCurrentOrgById: (id: string) => void;
  refreshOrgs: () => Promise<void>;
}

const Ctx = createContext<OrgCtx>(null!);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentOrgRole, setCurrentOrgRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOrgs = async () => {
    if (!user) {
      setOrgs([]);
      setCurrentOrg(null);
      setCurrentOrgRole(null);
      return;
    }

    try {
      const data = await api.listOrgs();
      const fetchedOrgs = data.orgs || [];
      setOrgs(fetchedOrgs);

      // Default to first org if none selected or current is gone
      if (fetchedOrgs.length > 0 && (!currentOrg || !fetchedOrgs.find((o: Organization) => o.id === currentOrg.id))) {
        setCurrentOrg(fetchedOrgs[0]);
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRole = async (orgId: string) => {
    try {
      const data = await api.getOrg(orgId);
      const members = data.members || [];
      const me = members.find((m: OrgMember) => m.id === user?.id);
      setCurrentOrgRole(me ? me.org_role : null);
    } catch (err) {
      console.error('Failed to fetch org role', err);
      setCurrentOrgRole(null);
    }
  };

  useEffect(() => {
    refreshOrgs();
  }, [user]);

  useEffect(() => {
    if (currentOrg) {
      fetchRole(currentOrg.id);
    } else {
      setCurrentOrgRole(null);
    }
  }, [currentOrg]);

  const setCurrentOrgById = (id: string) => {
    const org = orgs.find(o => o.id === id);
    if (org) setCurrentOrg(org);
  };

  return (
    <Ctx.Provider value={{ 
      orgs, 
      currentOrg, 
      currentOrgRole, 
      loading, 
      setCurrentOrgById, 
      refreshOrgs 
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useOrg = () => useContext(Ctx);
