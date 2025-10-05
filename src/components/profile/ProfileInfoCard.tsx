import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

interface ProfileInfoCardProps {
  profileData: {
    full_name: string;
    email: string;
    country_code: string;
    timezone: string;
    created_at: string;
    is_email_verified: boolean;
  };
  isEditing: boolean;
  hasChanges: boolean;
  onEdit: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ProfileInfoCard = ({
  profileData,
  isEditing,
  hasChanges,
  onEdit,
  onSave,
  onChange
}: ProfileInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal details and account information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-start space-x-4">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarFallback className="text-xl bg-primary/10">
              {profileData.full_name ? getInitials(profileData.full_name) : <User className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{profileData.full_name || 'User'}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-sm text-muted-foreground break-all sm:break-normal">{profileData.email}</p>
              {profileData.is_email_verified && (
                <Badge variant="secondary" className="text-xs w-fit">Verified</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={onChange}
                className="pl-10"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                className="pl-10"
                disabled={true}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_code">Country</Label>
            <Input
              id="country_code"
              name="country_code"
              value={profileData.country_code}
              disabled={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              value={profileData.timezone}
              disabled={true}
            />
          </div>

          <div className="space-y-2">
            <Label>Member Since</Label>
            <Input
              value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : '-'}
              disabled={true}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={isEditing ? onSave : onEdit}
            variant={hasChanges && isEditing ? "default" : "outline"}
            className={hasChanges && isEditing ? "animate-pulse" : ""}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
          
          <ChangePasswordDialog />
        </div>
      </CardContent>
    </Card>
  );
};
