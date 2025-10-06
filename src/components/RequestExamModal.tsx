import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RequestExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestExamModal: React.FC<RequestExamModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    examName: '',
    examType: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to request a new exam.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.examName.trim() || !formData.examType.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide exam name and type.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('exam_requests').insert({
        user_id: user.id,
        exam_name: formData.examName.trim(),
        exam_type: formData.examType.trim(),
        reason: formData.reason.trim() || null,
        status: 'pending',
      } as any);

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Thank you! We will review your exam request.',
      });

      setFormData({ examName: '', examType: '', reason: '' });
      onClose();
    } catch (error: any) {
      console.error('Error submitting exam request:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request New Exam</DialogTitle>
          <DialogDescription>
            Can't find the exam you're looking for? Let us know and we'll consider adding it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="examName">Exam Name *</Label>
            <Input
              id="examName"
              placeholder="e.g., UPSC CSE, CAT, CLAT"
              value={formData.examName}
              onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examType">Exam Type *</Label>
            <Input
              id="examType"
              placeholder="e.g., Government, Medical, Engineering"
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you need this exam? (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Tell us why this exam is important to you..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
