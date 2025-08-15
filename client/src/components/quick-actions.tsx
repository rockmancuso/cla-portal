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
      icon: FileText,
      label: "Email Support",
      href: "mailto:membership@laundryassociation.org?subject=Member%20Portal%20Support%20Request",
    },
    {
      icon: Headphones,
      label: "Call Support",
      href: "tel:+18005705629",
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <Zap className="h-5 w-5 text-primary mr-3" />
          Quick Support
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {actions.map((action, index) => {
            if (action.href) {
              return (
                <a
                  key={index}
                  href={action.href}
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start p-3 h-auto hover:bg-cla-blue transition-colors"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground mr-3" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </a>
              );
            }
            
            return (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start p-3 h-auto hover:bg-cla-blue transition-colors"
              >
                <action.icon className="h-4 w-4 text-muted-foreground mr-3" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
