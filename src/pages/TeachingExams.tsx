import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { useCountryDetection } from '@/hooks/useCountryDetection';

const TeachingExams = () => {
  const { isIndia } = useCountryDetection();

  const indiaTeachingExams = [
    { name: 'CTET', description: 'Central Teacher Eligibility Test - Paper 1 & 2' },
    { name: 'UPTET', description: 'Uttar Pradesh Teacher Eligibility Test' },
    { name: 'MPTET', description: 'Madhya Pradesh Teacher Eligibility Test' },
    { name: 'REET', description: 'Rajasthan Eligibility Examination for Teachers' },
    { name: 'HTET', description: 'Haryana Teacher Eligibility Test' },
    { name: 'BTET', description: 'Bihar Teacher Eligibility Test' },
    { name: 'OTET', description: 'Odisha Teacher Eligibility Test' },
    { name: 'WBTET', description: 'West Bengal Teacher Eligibility Test' },
    { name: 'KVS', description: 'Kendriya Vidyalaya Sangathan Teacher' },
    { name: 'NVS', description: 'Navodaya Vidyalaya Samiti Teacher' },
    { name: 'DSSSB TGT/PGT', description: 'Delhi TGT & PGT Teacher Recruitment' },
    { name: 'Super TET', description: 'Uttar Pradesh Super TET Exam' },
  ];

  const globalLanguageExams = [
    { name: 'IELTS', description: 'International English Language Testing System' },
    { name: 'TOEFL', description: 'Test of English as a Foreign Language' },
    { name: 'TOEIC', description: 'Test of English for International Communication' },
    { name: 'Cambridge English', description: 'FCE, CAE, CPE Certifications' },
    { name: 'Duolingo English', description: 'Duolingo English Test for Universities' },
    { name: 'PTE Academic', description: 'Pearson Test of English Academic' },
    { name: 'CELPIP', description: 'Canadian English Language Proficiency Index' },
    { name: 'OET', description: 'Occupational English Test for Healthcare' },
    { name: 'DELF/DALF', description: 'French Language Proficiency Diplomas' },
    { name: 'TestDaF', description: 'German as a Foreign Language Test' },
    { name: 'JLPT', description: 'Japanese Language Proficiency Test' },
    { name: 'HSK', description: 'Chinese Hanyu Shuiping Kaoshi' },
  ];

  const exams = isIndia ? indiaTeachingExams : globalLanguageExams;

  const indiaSyllabusSections = [
    { name: 'Child Development & Pedagogy', description: 'CDP theories, learning principles, child psychology' },
    { name: 'Mathematics', description: 'Number system, algebra, geometry, mensuration' },
    { name: 'Environmental Studies', description: 'EVS concepts for primary level' },
    { name: 'Hindi Language', description: 'Hindi grammar, comprehension, teaching methods' },
    { name: 'English Language', description: 'English grammar, comprehension, pedagogy' },
    { name: 'Science & Social Science', description: 'For upper primary and secondary level' },
  ];

  const globalSyllabusSections = [
    { name: 'Listening', description: 'Audio comprehension, note-taking, understanding accents' },
    { name: 'Reading', description: 'Passage analysis, vocabulary, comprehension skills' },
    { name: 'Writing', description: 'Essay writing, task response, coherence & cohesion' },
    { name: 'Speaking', description: 'Fluency, pronunciation, vocabulary usage' },
    { name: 'Grammar', description: 'Sentence structure, tenses, advanced grammar' },
    { name: 'Vocabulary', description: 'Academic word lists, idioms, collocations' },
  ];

  const syllabusSections = isIndia ? indiaSyllabusSections : globalSyllabusSections;

  const seoContent = isIndia ? {
    title: "Teaching Exam Tracker – CTET, TET Syllabus & Preparation | ExamTracker",
    description: "Track your teaching exam preparation with ExamTracker. Topic-wise syllabus tracker for CTET, UPTET, State TETs. Monitor CDP, Maths, EVS progress & study smarter.",
    keywords: "teaching exam tracker, CTET syllabus tracker, TET preparation app, UPTET exam tracker, teaching exam syllabus, CTET preparation progress, teacher exam planner, CDP syllabus tracker, CTET Paper 1 syllabus, CTET Paper 2 syllabus",
    h1: "Teaching Exam Tracker – Crack",
    h1Highlight: "CTET & TET",
    h1Suffix: "with Ease",
    heroText: "Preparing for CTET, UPTET, or State TET? ExamTracker helps you track topic-wise syllabus for Child Development & Pedagogy, Maths, EVS, Languages. Never miss any topic – become a government teacher!",
    sectionTitle: "Teaching Exams We Support",
    sectionSubtitle: "Track syllabus for CTET and all State TET exams",
    syllabusTitle: "CTET/TET Syllabus Sections on ExamTracker",
    ctaTitle: "Ready to Crack CTET / TET?",
    ctaText: "Track your teaching exam syllabus topic-wise. Join 50,000+ aspiring teachers on ExamTracker!",
    pageSlug: "Teaching Exams",
    featureTitle: "Why Use ExamTracker for Teaching Exam Preparation?",
    feature1Title: "Topic-Wise CDP Tracker",
    feature1Text: "Track Child Development & Pedagogy topics like Piaget, Vygotsky, Kohlberg theories. Mark each concept as complete.",
    feature2Title: "Paper 1 & Paper 2 Separate",
    feature2Text: "CTET Paper 1 (Primary) and Paper 2 (Upper Primary) have different syllabi. Track both separately.",
    feature3Title: "Visual Progress Tracker",
    feature3Text: "See your CTET preparation progress with visual progress bars. Know exactly how much is complete."
  } : {
    title: "Language Exam Tracker – IELTS, TOEFL, PTE Preparation | ExamTracker",
    description: "Track your language exam preparation with ExamTracker. Topic-wise syllabus tracker for IELTS, TOEFL, PTE, Cambridge. Monitor Listening, Reading, Writing, Speaking progress.",
    keywords: "IELTS exam tracker, TOEFL preparation app, language exam tracker, PTE syllabus tracker, English proficiency test prep, IELTS band 7 preparation, TOEFL iBT tracker, language certification tracker, Cambridge English prep",
    h1: "Language Exam Tracker – Ace",
    h1Highlight: "IELTS, TOEFL & More",
    h1Suffix: "with Confidence",
    heroText: "Preparing for IELTS, TOEFL, or PTE? ExamTracker helps you track topic-wise syllabus for Listening, Reading, Writing, and Speaking. Never miss any skill area – achieve your target score!",
    sectionTitle: "Language Exams We Support",
    sectionSubtitle: "Track syllabus for IELTS, TOEFL, PTE and all major language proficiency tests",
    syllabusTitle: "Language Exam Sections on ExamTracker",
    ctaTitle: "Ready to Ace Your Language Exam?",
    ctaText: "Track your IELTS/TOEFL syllabus section-wise. Join thousands of test-takers on ExamTracker!",
    pageSlug: "Language Exams",
    featureTitle: "Why Use ExamTracker for Language Exam Preparation?",
    feature1Title: "Skill-Wise Tracker",
    feature1Text: "Track Listening, Reading, Writing, Speaking skills separately. Mark each practice module as complete.",
    feature2Title: "Test Format Specific",
    feature2Text: "IELTS Academic vs General, TOEFL iBT vs PBT have different formats. Track according to your test type.",
    feature3Title: "Visual Progress Tracker",
    feature3Text: "See your language exam preparation progress with visual progress bars. Know exactly how much practice is complete."
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": seoContent.pageSlug, "item": "https://examtrakr.com/teaching-exams" }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{seoContent.title}</title>
        <meta name="description" content={seoContent.description} />
        <meta name="keywords" content={seoContent.keywords} />
        <meta property="og:title" content={seoContent.title} />
        <meta property="og:description" content={seoContent.description} />
        <meta property="og:url" content="https://examtrakr.com/teaching-exams" />
        <link rel="canonical" href="https://examtrakr.com/teaching-exams" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">{seoContent.pageSlug}</span>
              </nav>
              
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  {seoContent.h1}{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {seoContent.h1Highlight}
                  </span>{' '}
                  {seoContent.h1Suffix}
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {seoContent.heroText}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/exams">{isIndia ? "Explore Teaching Exams" : "Explore Language Exams"}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Why Teaching Exam Tracker */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">
                {seoContent.featureTitle}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{seoContent.feature1Title}</h3>
                    <p className="text-muted-foreground">
                      {seoContent.feature1Text}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{seoContent.feature2Title}</h3>
                    <p className="text-muted-foreground">
                      {seoContent.feature2Text}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{seoContent.feature3Title}</h3>
                    <p className="text-muted-foreground">
                      {seoContent.feature3Text}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Exams List */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                {seoContent.sectionTitle}
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                {seoContent.sectionSubtitle}
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {exams.map((exam, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{exam.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{exam.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Syllabus Sections */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">
                {seoContent.syllabusTitle}
              </h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {syllabusSections.map((section, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground mb-1">{section.name}</h3>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-primary to-secondary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                {seoContent.ctaTitle}
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                {seoContent.ctaText}
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">Start Tracking Today</Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TeachingExams;
