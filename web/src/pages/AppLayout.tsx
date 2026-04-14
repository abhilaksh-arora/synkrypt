import { Outlet, useLocation, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

interface AppLayoutProps {
  title?: string;
}

export default function AppLayout({ title }: AppLayoutProps) {
  const { user } = useAuth();
  const { id: projectId } = useParams();
  const location = useLocation();
  const [project, setProject] = useState<any>(null);

  const isProjectPage = location.pathname.startsWith('/projects/');

  useEffect(() => {
    if (isProjectPage && projectId) {
      api.getProject(projectId).then(d => {
        setProject(d.project);
      }).catch(() => setProject(null));
    } else {
      setProject(null);
    }
  }, [projectId, isProjectPage]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
      {user && <Sidebar />}
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${user ? 'ml-[200px]' : ''}`}>
        <header className="h-12 flex items-center justify-between px-6 border-b border-border/30 backdrop-blur-md bg-background/90 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-semibold text-[11px] uppercase tracking-widest opacity-50">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                {isProjectPage && projectId && (
                  <>
                    <BreadcrumbSeparator><ChevronRight className="w-3 h-3 text-muted-foreground/40" /></BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-semibold text-[11px] uppercase tracking-widest text-primary">
                        Project: {project?.name || 'Loading...'}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}

                {!isProjectPage && location.pathname !== '/' && (
                  <>
                    <BreadcrumbSeparator><ChevronRight className="w-3 h-3 text-muted-foreground/40" /></BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-semibold text-[11px] uppercase tracking-widest text-primary">
                        {location.pathname.slice(1).replace('-', ' ')}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold uppercase tracking-widest text-primary">System Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6 relative scrollbar-none">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-w-[1400px] mx-auto w-full pb-12"
            >
              {title && (
                <header className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                </header>
              )}
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
