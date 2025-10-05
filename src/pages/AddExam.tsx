import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: string;
  name: string;
  marks?: number;
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

const AddExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSubject = () => {
    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: '',
      topics: []
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubjectName = (subjectId: string, name: string) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === subjectId ? { ...subject, name } : subject
    ));
  };

  const removeSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
  };

  const addTopic = (subjectId: string) => {
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      name: '',
      marks: undefined
    };
    
    setSubjects(prev => prev.map(subject => 
      subject.id === subjectId 
        ? { ...subject, topics: [...subject.topics, newTopic] }
        : subject
    ));
  };

  const updateTopicName = (subjectId: string, topicId: string, name: string) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            topics: subject.topics.map(topic => 
              topic.id === topicId ? { ...topic, name } : topic
            )
          }
        : subject
    ));
  };

  const updateTopicMarks = (subjectId: string, topicId: string, marks: string) => {
    const marksNumber = marks ? parseInt(marks, 10) : undefined;
    setSubjects(prev => prev.map(subject => 
      subject.id === subjectId 
        ? {
            ...subject,
            topics: subject.topics.map(topic => 
              topic.id === topicId ? { ...topic, marks: marksNumber } : topic
            )
          }
        : subject
    ));
  };

  const removeTopic = (subjectId: string, topicId: string) => {
    setSubjects(prev => prev.map(subject => 
      subject.id === subjectId 
        ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
        : subject
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examName.trim()) {
      toast({
        title: "Error",
        description: "Exam name is required",
        variant: "destructive"
      });
      return;
    }

    // Validate subjects
    const validSubjects = subjects.filter(subject => subject.name.trim());
    if (validSubjects.length === 0) {
      toast({
        title: "Error", 
        description: "At least one subject with a name is required",
        variant: "destructive"
      });
      return;
    }

    // Validate topics within subjects
    const subjectsWithValidTopics = validSubjects.map(subject => ({
      ...subject,
      topics: subject.topics.filter(topic => topic.name.trim())
    }));

    const totalTopics = subjectsWithValidTopics.reduce((sum, subject) => sum + subject.topics.length, 0);

    setIsSubmitting(true);
    
    try {
      toast({
        title: "Success",
        description: `${examName} has been added successfully!`,
        variant: "default"
      });
      
      // Navigate back to exams page
      navigate('/exams');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Add Custom Exam - Examtrakr | Create Custom Exam Structure</title>
        <meta 
          name="description" 
          content="Create and customize your own exam structure on Examtrakr with sections, topics, and subtopics." 
        />
        <link rel="canonical" href="/exams/add" />
        <meta name="robots" content="noindex, nofollow" />
        <meta 
          name="description" 
          content="Create and add new exam structures with subjects and topics for comprehensive preparation planning." 
        />
        <link rel="canonical" href="/exams/add" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button asChild variant="ghost" className="mb-6">
              <Link to="/exams" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Exams
              </Link>
            </Button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Add Custom Exam</h1>
              <p className="text-muted-foreground">
                Create your personalized exam with custom subjects and topics
              </p>
            </div>

            {/* Form */}
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="examName" className="text-sm font-medium">
                        Exam Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="examName"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="e.g., UPSC, CAT, GATE"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="examType" className="text-sm font-medium">
                        Exam Type
                      </Label>
                      <Input
                        id="examType"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                        placeholder="e.g., Civil Services, Management, Engineering (optional)"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Subjects Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Subjects</h3>
                      <Button
                        type="button"
                        onClick={addSubject}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Subject
                      </Button>
                    </div>

                    {subjects.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="p-8 text-center">
                          <p className="text-muted-foreground mb-4">No subjects added yet</p>
                          <Button
                            type="button"
                            onClick={addSubject}
                            variant="hero"
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Your First Subject
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4">
                      {subjects.map((subject, subjectIndex) => (
                        <Card key={subject.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Subject {subjectIndex + 1}
                              </CardTitle>
                              <Button
                                type="button"
                                onClick={() => removeSubject(subject.id)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">
                                Subject Name <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={subject.name}
                                onChange={(e) => updateSubjectName(subject.id, e.target.value)}
                                placeholder="e.g., Mathematics, Physics, English"
                                className="mt-1"
                                required
                              />
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Topics</h4>
                              <Button
                                type="button"
                                onClick={() => addTopic(subject.id)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Add Topic
                              </Button>
                            </div>

                            {subject.topics.length === 0 && (
                              <div className="text-center py-6 border border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">No topics added</p>
                                <Button
                                  type="button"
                                  onClick={() => addTopic(subject.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                >
                                  Add Topic
                                </Button>
                              </div>
                            )}

                            <div className="space-y-3">
                              {subject.topics.map((topic, topicIndex) => (
                                <div key={topic.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Topic Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                      value={topic.name}
                                      onChange={(e) => updateTopicName(subject.id, topic.id, e.target.value)}
                                      placeholder={`Topic ${topicIndex + 1}`}
                                      className="mt-1 h-8 text-sm"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="w-24">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Marks
                                    </Label>
                                    <Input
                                      type="number"
                                      value={topic.marks || ''}
                                      onChange={(e) => updateTopicMarks(subject.id, topic.id, e.target.value)}
                                      placeholder="10"
                                      className="mt-1 h-8 text-sm"
                                      min="0"
                                    />
                                  </div>
                                  
                                  <Button
                                    type="button"
                                    onClick={() => removeTopic(subject.id, topic.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {subject.topics.length > 0 && (
                              <div className="flex items-center gap-2 pt-2">
                                <Badge variant="outline" className="text-xs">
                                  {subject.topics.length} topics
                                </Badge>
                                {subject.topics.some(t => t.marks) && (
                                  <Badge variant="outline" className="text-xs">
                                    {subject.topics.reduce((sum, t) => sum + (t.marks || 0), 0)} total marks
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {subjects.length > 0 && (
                    <Card className="bg-accent/50">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Summary</h4>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{subjects.filter(s => s.name.trim()).length} subjects</span>
                          <span>•</span>
                          <span>
                            {subjects.reduce((sum, s) => sum + s.topics.filter(t => t.name.trim()).length, 0)} topics
                          </span>
                          {subjects.some(s => s.topics.some(t => t.marks)) && (
                            <>
                              <span>•</span>
                              <span>
                                {subjects.reduce((sum, s) => 
                                  sum + s.topics.reduce((topicSum, t) => topicSum + (t.marks || 0), 0), 0
                                )} total marks
                              </span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button asChild variant="outline" disabled={isSubmitting}>
                      <Link to="/exams">Cancel</Link>
                    </Button>
                    <Button
                      type="submit"
                      variant="hero"
                      disabled={isSubmitting || !examName.trim()}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Exam'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AddExam;