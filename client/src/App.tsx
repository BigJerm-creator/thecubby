import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InventoryProvider } from "@/lib/InventoryContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Kitchen from "@/pages/Kitchen";
import CategoryView from "@/pages/CategoryView";
import Scan from "@/pages/Scan";
import ManualEntry from "@/pages/ManualEntry";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/category/:id" component={CategoryView} />
      <Route path="/scan" component={Scan} />
      <Route path="/manual-entry" component={ManualEntry} />
      <Route path="/search" component={Search} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InventoryProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </InventoryProvider>
    </QueryClientProvider>
  );
}

export default App;
