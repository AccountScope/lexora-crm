"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already set preferences
    const saved = localStorage.getItem("cookie-consent");
    if (!saved) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const prefs = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
  };

  const handleRejectAll = () => {
    const prefs = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
  };

  const handleSavePreferences = () => {
    const prefs = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Cookie Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to improve your experience, analyze site traffic, and personalize content.
              You can manage your preferences below.
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Essential Cookies</p>
                  <p className="text-xs text-muted-foreground">Required for the site to function</p>
                </div>
                <span className="text-xs text-muted-foreground">Always Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Analytics Cookies</p>
                  <p className="text-xs text-muted-foreground">Help us improve our service</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Marketing Cookies</p>
                  <p className="text-xs text-muted-foreground">Used for targeted advertising</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAcceptAll} size="sm">
                Accept All
              </Button>
              <Button onClick={handleRejectAll} variant="outline" size="sm">
                Reject All
              </Button>
              <Button onClick={handleSavePreferences} variant="secondary" size="sm">
                Save Preferences
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisible(false)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
