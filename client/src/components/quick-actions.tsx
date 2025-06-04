import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  FileText, 
  Headphones, 
  Users, 
  Zap 
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      icon: CreditCard,
      label: "Update Billing Info",
      onClick: () => console.log("Update billing"),
    },
    {
      icon: FileText,
      label: "Download Invoices",
      onClick: () => console.log("Download invoices"),
    },
    {
      icon: Headphones,
      label: "Contact Support",
      onClick: () => console.log("Contact support"),
    },
    {
      icon: Users,
      label: "Member Directory",
      onClick: () => console.log("Member directory"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <Zap className="h-5 w-5 text-primary mr-3" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start p-3 h-auto hover:bg-muted transition-colors"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4 text-muted-foreground mr-3" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
