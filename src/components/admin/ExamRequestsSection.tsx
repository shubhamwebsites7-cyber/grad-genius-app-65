import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ExamRequest {
  id: string;
  user_id: string;
  exam_name: string;
  exam_type: string | null;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const ExamRequestsSection = () => {
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchExamRequests();
  }, []);

  const fetchExamRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching exam requests:', error);
      toast({
        title: "Error",
        description: "Failed to load exam requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await (supabase
        .from('exam_requests')
        .update as any)({ 
          status,
          admin_notes: adminNotes[id] || null 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });

      fetchExamRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exam Requests</h2>
        <p className="text-muted-foreground">Manage user-submitted exam requests</p>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No exam requests yet</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{request.exam_name}</CardTitle>
                    {request.exam_type && (
                      <Badge variant="secondary" className="mt-2">{request.exam_type}</Badge>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.reason && (
                  <div>
                    <h4 className="font-semibold mb-2">Reason:</h4>
                    <p className="text-muted-foreground">{request.reason}</p>
                  </div>
                )}

                {request.admin_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Admin Notes:</h4>
                    <p className="text-muted-foreground">{request.admin_notes}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add admin notes (optional)"
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(request.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
