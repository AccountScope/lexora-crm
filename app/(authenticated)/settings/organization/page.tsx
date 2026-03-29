"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  settings: {
    timezone: string;
    currency: string;
    date_format: string;
    time_format: string;
  };
  subscription_tier: string;
  trial_ends_at: string;
}

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: "Error",
        description: "Failed to load organization settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organization)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization settings updated successfully"
        });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update organization settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Organization Found</h2>
        <p className="text-muted-foreground">Please create an organization first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization profile and preferences"
      />

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Your organization's public information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={organization.name}
                onChange={(e) =>
                  setOrganization({ ...organization, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={organization.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Cannot be changed after creation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={organization.email || ''}
                onChange={(e) =>
                  setOrganization({ ...organization, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={organization.phone || ''}
                onChange={(e) =>
                  setOrganization({ ...organization, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={organization.website || ''}
              onChange={(e) =>
                setOrganization({ ...organization, website: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Your organization's physical address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={organization.address?.street || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  address: { ...organization.address, street: e.target.value }
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={organization.address?.city || ''}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    address: { ...organization.address, city: e.target.value }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/County</Label>
              <Input
                id="state"
                value={organization.address?.state || ''}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    address: { ...organization.address, state: e.target.value }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">Postal Code</Label>
              <Input
                id="zip"
                value={organization.address?.zip || ''}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    address: { ...organization.address, zip: e.target.value }
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={organization.address?.country || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  address: { ...organization.address, country: e.target.value }
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Configure timezone, currency, and date formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={organization.settings?.timezone || 'Europe/London'}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    settings: { ...organization.settings, timezone: e.target.value }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={organization.settings?.currency || 'GBP'}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    settings: { ...organization.settings, currency: e.target.value }
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_format">Date Format</Label>
              <Input
                id="date_format"
                value={organization.settings?.date_format || 'DD/MM/YYYY'}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    settings: { ...organization.settings, date_format: e.target.value }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_format">Time Format</Label>
              <Input
                id="time_format"
                value={organization.settings?.time_format || '24h'}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    settings: { ...organization.settings, time_format: e.target.value }
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-semibold capitalize">{organization.subscription_tier}</p>
              <p className="text-sm text-muted-foreground">
                {organization.trial_ends_at
                  ? `Trial ends: ${new Date(organization.trial_ends_at).toLocaleDateString()}`
                  : 'Active subscription'}
              </p>
            </div>
            <Button variant="outline">Manage Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
