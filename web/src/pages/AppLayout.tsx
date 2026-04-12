import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, FolderKanban, KeyRound, Users, ShieldAlert, 
  LogOut, Settings, ChevronRight, LockKeyhole, BookOpen, ShieldCheck, Database
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarProvider, SidebarHeader, SidebarFooter, SidebarInset, SidebarTrigger
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  title?: string;
}

export default function AppLayout({ title }: AppLayoutProps) {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [org, setOrg] = useState<any>(null);
  const [project, setProject] = useState<any>(null);

  // Derive orgId and projectId based on route structure
  // In our V2 Routes:
  // /orgs/:id -> routeId is orgId
  // /projects/:id -> routeId is projectId
  const isOrgPage = location.pathname.startsWith('/orgs/');
  const isProjectPage = location.pathname.startsWith('/projects/');
  
  const orgId = isOrgPage ? routeId : (project?.org_id || null);
  const projectId = isProjectPage ? routeId : null;

  useEffect(() => {
    if (orgId) {
      api.getOrg(orgId).then(d => setOrg(d.org)).catch(() => setOrg(null));
    } else {
      setOrg(null);
    }
  }, [orgId]);

  useEffect(() => {
    if (projectId) {
      api.getProject(projectId).then(d => {
        setProject(d.project);
      }).catch(() => setProject(null));
    } else {
      setProject(null);
    }
  }, [projectId]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdmin = user?.role === 'admin';

  const orgMenuItems = orgId ? [
    { title: "Projects", url: `/orgs/${orgId}`, icon: FolderKanban },
    ...(isAdmin ? [
      { title: "Members", url: `/orgs/${orgId}/members`, icon: Users }, // Future enhancement
      { title: "Shared Sets", url: `#`, icon: Database },
      { title: "Rules", url: `#`, icon: ShieldCheck },
      { title: "Audit Logs", url: `#`, icon: ShieldAlert },
    ] : []),
  ] : [];

  const projectMenuItems = projectId ? [
    { title: "Secrets", url: `/projects/${projectId}`, icon: KeyRound },
    { title: "Settings", url: `/settings`, icon: Settings },
  ] : [];

  const mainMenuItems = [
    { title: "Dashboard", url: "/", icon: ShieldCheck },
    { title: "Organizations", url: "/orgs", icon: Building2 },
    ...(isAdmin ? [{ title: "Users", url: "/users", icon: Users }] : []),
  ];

  const generalMenuItems = [
    { title: "Documentation", url: "/docs", icon: BookOpen },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle} defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
        
        {/* SIDEBAR */}
        <Sidebar className="border-r border-border/50 bg-sidebar shadow-xl">
          <SidebarHeader className="h-16 flex items-center px-6 pt-2 pb-0">
            <Link to="/" className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight text-xl text-foreground">synk<span className="text-primary">rypt</span></span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3 py-6 flex flex-col gap-6 scrollbar-none">
            
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold px-2 mb-2">
                Discovery
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon className="size-4 opacity-70" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Contextual Org Group */}
            {orgId && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold px-2 mb-2">
                  Organization
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {orgMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                          <Link to={item.url}>
                            <item.icon className="size-4 opacity-70" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Contextual Project Group */}
            {projectId && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold px-2 mb-2">
                  Active Project
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projectMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                          <Link to={item.url}>
                            <item.icon className="size-4 opacity-70" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Footer Groups */}
            <div className="mt-auto">
               <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {generalMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                          <Link to={item.url}>
                            <item.icon className="size-4 opacity-70" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/10 bg-muted/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-muted/80 transition-all outline-none border border-transparent hover:border-border/30 hover:shadow-sm">
                  <Avatar className="h-9 w-9 rounded-xl border border-border/50 shadow-sm shadow-black/5">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold rounded-xl">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-xs min-w-0 flex-1">
                    <span className="font-bold leading-none truncate w-full text-foreground">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 truncate w-full">{user?.email}</span>
                  </div>
                  <ChevronRight className="size-3 text-muted-foreground/50 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56 shadow-2xl rounded-2xl border-border/40 p-1.5 animation-in slide-in-from-left-2 backdrop-blur-xl">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild className="rounded-lg h-10 cursor-pointer">
                   <Link to="/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4 opacity-70" />
                    Settings
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="rounded-lg h-10 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 opacity-70" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background transition-all">
          <header className="h-16 flex items-center justify-between px-8 border-b border-border/20 backdrop-blur-md bg-background/80 sticky top-0 z-40">
             <div className="flex items-center gap-4">
               <SidebarTrigger className="hover-elevate rounded-xl h-9 w-9" />
               <div className="w-px h-6 bg-border/40 mx-2" />
               <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  
                  {orgId && (
                    <>
                      <BreadcrumbSeparator><ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" /></BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {isProjectPage ? (
                           <BreadcrumbLink asChild>
                             <Link to={`/orgs/${orgId}`} className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
                               {org?.name || 'Loading...'}
                             </Link>
                           </BreadcrumbLink>
                        ) : (
                           <BreadcrumbPage className="font-bold text-sm text-foreground">{org?.name || 'Loading...'}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                  
                  {projectId && (
                    <>
                      <BreadcrumbSeparator><ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" /></BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-bold text-sm text-foreground">{project?.name || 'Loading...'}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
             </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scrollbar-none">
            <AnimatePresence mode="wait">
              <motion.div 
                key={location.pathname}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-6xl mx-auto w-full pb-20"
              >
                {title && (
                  <header className="mb-6 pt-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
                  </header>
                )}
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>

      </div>
    </SidebarProvider>
  );
}
