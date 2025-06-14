import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NavigationTest from "@/pages/navigation-test";
import NotFound from "@/pages/not-found";

// In App.tsx, add this before the Router function
console.log("App loading - Current location:");
console.log("- href:", window.location.href);
console.log("- pathname:", window.location.pathname);
console.log("- hash:", window.location.hash);

function Router() {
  console.log("Router rendering");
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/member-portal" component={Dashboard} />  {/* Add this line */}
      <Route path="/navigation-test" component={NavigationTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
