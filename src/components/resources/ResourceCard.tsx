import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Youtube,
  FileText,
  ExternalLink,
  BookOpen,
  Clock,
  Users,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
} from 'lucide-react';
import { LockedResourceOverlay } from '@/components/resources/LockedResourceOverlay';

export interface ResourceCardData {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'pdf' | 'website';
  url: string | null;
  helpfulCount: number;
  userHelpful: boolean;
  dateAdded: Date;
  isBookmarked?: boolean;
  topicName?: string;
  isPending?: boolean;
  contributorName?: string;
  contributorId?: string;
}

interface ResourceCardProps {
  resource: ResourceCardData;
  isLocked: boolean;
  userId?: string;
  onBookmark: (resourceId: string) => void;
  onToggleHelpful: (resourceId: string) => void;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video': return Youtube;
    case 'pdf': return FileText;
    case 'website': return ExternalLink;
    default: return BookOpen;
  }
};

const getResourceButtonText = (type: string) => {
  switch (type) {
    case 'video': return 'Watch Video';
    case 'pdf': return 'View PDF';
    case 'website': return 'Visit Website';
    default: return 'View Resource';
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isLocked,
  userId,
  onBookmark,
  onToggleHelpful,
}) => {
  const IconComponent = getResourceIcon(resource.type);
  const isOwnContribution = resource.contributorId === userId;

  return (
    <Card
      className={`transition-all duration-200 relative ${
        isLocked ? 'opacity-70 cursor-not-allowed' : ''
      } ${resource.isBookmarked ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
    >
      {isLocked && <LockedResourceOverlay />}

      <CardContent className="p-5 space-y-3">
        {/* Top: Title + Bookmark */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground line-clamp-2">
              {resource.title}
            </h3>
            {resource.topicName && resource.topicName !== 'Unknown Topic' && (
              <p className="text-xs text-muted-foreground mt-1">
                {resource.topicName}
              </p>
            )}
            {!resource.topicName || resource.topicName === 'Unknown Topic' ? (
              <p className="text-xs text-muted-foreground mt-1">General</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {resource.isPending && (
              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                Pending
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onBookmark(resource.id)}
              className={`shrink-0 h-8 w-8 p-0 ${
                resource.isBookmarked ? 'text-primary' : ''
              }`}
              title={resource.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {resource.isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Added by + Date row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Added by {isOwnContribution ? 'You' : (resource.contributorName || 'Anonymous')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{resource.dateAdded.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Upvote + Action Button row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Upvote Button */}
          <Button
            variant={resource.userHelpful ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleHelpful(resource.id)}
            className={`gap-1.5 text-xs ${
              resource.userHelpful
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                : 'hover:bg-primary/5 hover:text-primary hover:border-primary/30'
            }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${resource.userHelpful ? 'fill-current' : ''}`} />
            <span>{resource.helpfulCount}</span>
            <span className="hidden sm:inline">Helpful</span>
          </Button>

          {/* Action Button */}
          {!isLocked && resource.url ? (
            <Button
              asChild
              variant="hero"
              size="sm"
              className="flex-1"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {getResourceButtonText(resource.type)}
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 pointer-events-none"
              disabled
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {getResourceButtonText(resource.type)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
