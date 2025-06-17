// components/ResearchAgent.tsx
"use client";

import { useState } from "react";
import { Search, ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResearchPlan, ProcessedSearchResult, ResearchArtifact, ResearchStep } from "@/lib/types";
// Note: Run `npm install framer-motion` or `yarn add framer-motion` to install this dependency
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function ResearchAgent() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();

  // State management
  const [query, setQuery] = useState<string>("");
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [artifacts, setArtifacts] = useState<ResearchArtifact[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("plan");
  const [error, setError] = useState<string>("");
  
  // Track active features for animations
  const [activeFeatures, setActiveFeatures] = useState<{
    search: boolean;
    planning: boolean;
    quality: boolean;
    synthesis: boolean;
    depth: boolean;
  }>({
    search: false,
    planning: false,
    quality: false,
    synthesis: false,
    depth: false
  });

  // Track active workflow stages
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<{
    planning: boolean;
    evaluation: boolean;
    digDeeper: boolean;
  }>({
    planning: false,
    evaluation: false,
    digDeeper: false
  });

  // Start research
  const startResearch = async () => {
    if (!query.trim()) return;
    
    setIsResearching(true);
    setResearchPlan(null);
    setArtifacts([]);
    setSummary("");
    setError("");
    
    try {
      const response = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start research');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setResearchPlan(data.plan);
      setActiveTab('plan');
      
      // Begin executing the research plan
      await executeResearchPlan(data.sessionId);
    } catch (error) {
      setError('Failed to start research: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsResearching(false);
    }
  };

  // Execute research plan
  const executeResearchPlan = async (sid: string) => {
    const currentId = sid || sessionId;
    if (!currentId) return;
    
    try {
      // Initial wait to give time for UI update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Activate planning feature indicator and workflow stage
      setActiveFeatures(prev => ({ ...prev, planning: true }));
      setActiveWorkflowStage(prev => ({ ...prev, planning: true, evaluation: false, digDeeper: false }));
      
      while (true) {
        const response = await fetch('/api/research/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.isComplete) {
            // Research is complete
            setIsResearching(false);
            break;
          }
          throw new Error('Failed to execute step');
        }
        
        const data = await response.json();
        
        // Update the research plan
        setResearchPlan(prev => {
          if (!prev) return null;
          
          const updatedSteps = prev.steps.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'completed' as const } 
              : step
          );
          
          return { ...prev, steps: updatedSteps };
        });
        
        // Update artifacts
        if (data.result) {
          const stepInfo = researchPlan?.steps.find(s => s.id === data.stepId);
          if (stepInfo) {
            setArtifacts(prev => [
              ...prev, 
              {
                taskId: data.stepId,
                taskType: stepInfo.action.type,
                artifact: data.result
              }
            ]);
            
            // Update active feature indicators based on step type
            if (stepInfo.action.type === 'search') {
              setActiveFeatures(prev => ({ ...prev, search: true, planning: false }));
              setActiveWorkflowStage(prev => ({ ...prev, planning: false, evaluation: true }));
            } else if (stepInfo.action.type === 'summarize') {
              setActiveFeatures(prev => ({ ...prev, synthesis: true, quality: false }));
              setActiveWorkflowStage(prev => ({ ...prev, planning: false, evaluation: false }));
              setSummary(data.result);
              setActiveTab('summary');
            } else {
              // For other action types like fetch_webpage, fetch_paper, fetch_github
              setActiveFeatures(prev => ({ ...prev, quality: true, search: false }));
              setActiveWorkflowStage(prev => ({ ...prev, planning: false, evaluation: true }));
            }
          }
        }
        
        // If plan is complete, break the loop
        if (data.isComplete) {
          setIsResearching(false);
          // Reset active features and workflow stages after a delay
          setTimeout(() => {
            setActiveFeatures({
              search: false,
              planning: false,
              quality: false,
              synthesis: false,
              depth: false
            });
            setActiveWorkflowStage({
              planning: false,
              evaluation: false,
              digDeeper: false
            });
          }, 2000);
          break;
        }
        
        // Wait a bit before the next step
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      setError('Error during research: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsResearching(false);
    }
  };

  // Dig deeper for more research
  const digDeeper = async () => {
    if (!sessionId || isResearching || !researchPlan) return;
    
    setIsResearching(true);
    setError('');
    
    // Activate depth feature indicator and workflow stage
    setActiveFeatures(prev => ({ ...prev, depth: true }));
    setActiveWorkflowStage(prev => ({ ...prev, planning: false, evaluation: false, digDeeper: true }));
    
    try {
      // Create additional steps using GPT-4
      const response = await fetch('/api/research/dig-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to dig deeper');
      }
      
      const data = await response.json();
      
      // Add new steps to the research plan
      setResearchPlan(prev => {
        if (!prev) return null;
        
        // Ensure the steps have the correct type for status
        const typedSteps = data.additionalSteps.map((step: ResearchStep) => ({
          ...step,
          status: step.status as 'pending' | 'in-progress' | 'completed' | 'failed'
        }));
        
        return {
          ...prev,
          steps: [...prev.steps, ...typedSteps]
        };
      });
      
      // Execute the new steps
      await executeResearchPlan(sessionId);
    } catch (error) {
      setError('Failed to dig deeper: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsResearching(false);
    }
  };

  // Feature Card Component with animations
  const FeatureCard = ({ 
    icon, 
    title, 
    description, 
    isActive 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    isActive: boolean;
  }) => {
    return (
      <motion.div
        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer
                    ${isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'} 
                    transition-colors shadow-sm
                    dark:bg-opacity-5 dark:shadow-inner
                    ${isActive ? 'shadow-inner' : 'hover:shadow-md'}
                    `}
          initial={{ opacity: 0.9, x: -10 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          y: isActive && !prefersReducedMotion ? [0, -5, 0] : 0,
          transition: {
            y: isActive && !prefersReducedMotion ? { repeat: Infinity, duration: 1.5, repeatType: "reverse" } : {}
          }
        }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        whileHover={{ 
          scale: prefersReducedMotion ? 1 : 1.02, 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
        role="region"
        aria-label={`${title} feature ${isActive ? 'active' : 'inactive'}`}
      >
        <motion.div
          animate={{
            rotate: isActive && !prefersReducedMotion ? [0, 15, 0, -15, 0] : 0,
            scale: isActive && !prefersReducedMotion ? [1, 1.2, 1] : 1,
            color: isActive ? "#6366F1" : "#71717A"
          }}
          transition={{
            duration: 0.8,
            repeat: isActive && !prefersReducedMotion ? Infinity : 0,
            repeatType: "reverse",
            repeatDelay: 1
          }}
          className={`mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
          style={{ willChange: 'transform' }}
          aria-hidden="true"
        >
          {icon}
        </motion.div>
        <div>
          <motion.span 
            className="font-medium block"
            animate={{ color: isActive ? "#6366F1" : "#000000" }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.span>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isActive && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5 }}
              className="h-0.5 bg-primary mt-2 rounded-full"
            />
          )}
        </div>
      </motion.div>
    );
  };

  // Workflow Step Component with animations
  const WorkflowStep = ({ 
    icon, 
    title, 
    description, 
    isActive,
    isLast = false
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    isActive: boolean;
    isLast?: boolean;
  }) => {
    return (
      <div className="relative">
        <motion.div
          className={`flex items-start gap-3 p-4 rounded-lg
                    ${isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : ''} 
                    transition-colors
                    ${isActive ? 'shadow-inner' : ''}
                    `}
          initial={{ opacity: 0.8, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            x: isActive && !prefersReducedMotion ? [0, 5, 0] : 0,
            transition: {
              y: { type: "spring", stiffness: 300, damping: 15 },
              x: isActive && !prefersReducedMotion ? { repeat: Infinity, duration: 2, repeatType: "reverse" } : {}
            }
          }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)'
          }}
          role="region"
          aria-label={`${title} workflow stage ${isActive ? 'active' : 'inactive'}`}
        >
          <div className="relative z-10">
            <motion.div
              animate={{
                scale: isActive ? [1, 1.2, 1] : 1,
                color: isActive ? "#6366F1" : "#71717A"
              }}
              transition={{
                duration: 1,
                repeat: isActive ? Infinity : 0,
                repeatType: "reverse"
              }}
              className={`mt-1 p-2 rounded-full bg-muted
                ${isActive ? 'text-primary bg-primary/20' : 'text-muted-foreground'}
              `}
            >
              {icon}
            </motion.div>
          </div>
          
          <div className="flex-1">
            <motion.p 
              className="font-medium"
              animate={{ color: isActive ? "#6366F1" : "#000000" }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {isActive && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
                className="h-0.5 bg-primary mt-2 rounded-full"
              />
            )}
          </div>
        </motion.div>
        
        {!isLast && (
          <motion.div 
            className="absolute left-[1.65rem] top-[3.5rem] w-[2px] h-[calc(100%-1rem)] bg-muted"
            initial={{ height: 0 }}
            animate={{ 
              height: "calc(100% - 1rem)",
              background: isActive && !prefersReducedMotion ? 
                ["#e2e8f0", "#6366F1", "#e2e8f0"] : 
                "#e2e8f0"
            }}
            transition={{
              height: { duration: 0.5 },
              background: isActive && !prefersReducedMotion ? 
                { repeat: Infinity, duration: 1.5, repeatType: "reverse" } : 
                { duration: 0.5 }
            }}
            style={{ willChange: 'opacity, background' }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  // Render the UI
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-6" style={{ fontFamily: "cursive" }}>
            Research Agent
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Input and tools */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What would you like to research today?</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Enter your research question or topic..." 
                  className="min-h-[120px]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isResearching}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={startResearch}
                  disabled={isResearching || !query.trim()}
                >
                  {isResearching ? 'Researching...' : 'Start Research'}
                </Button>
              </CardFooter>
            </Card>

            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-center gap-2"
                  >
                    <CardTitle>Advanced Features</CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    <FeatureCard 
                      key="search"
                      icon={<Search className="h-5 w-5" />}
                      title="Intelligent Web Search"
                      description="Scans and evaluates multiple high-quality sources"
                      isActive={activeFeatures.search}
                    />
                    
                    <FeatureCard 
                      key="planning"
                      icon={<ArrowRight className="h-5 w-5" />}
                      title="Strategic Research Planning"
                      description="Creates clear research plans with specific steps"
                      isActive={activeFeatures.planning}
                    />
                    
                    <FeatureCard 
                      key="quality"
                      icon={<ArrowRight className="h-5 w-5" />}
                      title="Quality Assessment"
                      description="Establishes evaluation criteria for information quality"
                      isActive={activeFeatures.quality}
                    />
                    
                    <FeatureCard 
                      key="synthesis"
                      icon={<ArrowRight className="h-5 w-5" />}
                      title="Comprehensive Synthesis"
                      description="Synthesizes findings into coherent summaries"
                      isActive={activeFeatures.synthesis}
                    />
                    
                    <FeatureCard 
                      key="depth"
                      icon={<ArrowDown className="h-5 w-5" />}
                      title="Adaptive Research Depth"
                      description="Determines when to explore topics more deeply"
                      isActive={activeFeatures.depth}
                    />
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            <Card>
              <CardHeader>
                <CardTitle>Dig Deeper</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={digDeeper}
                  disabled={!sessionId || isResearching || artifacts.length === 0}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Explore Further
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right panel - Results and workflow */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-center gap-2"
                  >
                    <CardTitle>Agent Workflow</CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <AnimatePresence>
                    <div className="space-y-0">
                      <WorkflowStep 
                        key="planning"
                        icon={<ArrowRight className="h-5 w-5" />}
                        title="Planning Agent"
                        description="Creates a research plan with specific steps to follow"
                        isActive={activeWorkflowStage.planning}
                      />
                      
                      <WorkflowStep 
                        key="evaluation"
                        icon={<ArrowRight className="h-5 w-5" />}
                        title="Evaluation Agent"
                        description="Judges if the search results are good enough"
                        isActive={activeWorkflowStage.evaluation}
                      />
                      
                      <WorkflowStep 
                        key="dig-deeper"
                        icon={<ArrowDown className="h-5 w-5" />}
                        title="Dig Deeper"
                        description="Explores topics in greater depth when needed"
                        isActive={activeWorkflowStage.digDeeper}
                        isLast={true}
                      />
                    </div>
                  </AnimatePresence>
                </CardContent>
                
                {isResearching && (
                  <motion.div
                    className="h-1 bg-primary/20"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: "100%",
                      transition: { duration: 3, repeat: Infinity }
                    }}
                  />
                )}
              </Card>
            </motion.div>

            <Card>
              <CardHeader>
                <CardTitle>Research Results</CardTitle>
                {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="plan">Research Plan</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>
                  
                  {/* Research Plan Tab */}
                  <TabsContent value="plan" className="mt-4 space-y-4">
                    {researchPlan ? (
                      researchPlan.steps.map((step) => (
                        <div 
                          key={step.id} 
                          className={`p-4 border rounded-md ${
                            step.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                            step.status === 'in-progress' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' :
                            step.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' :
                            'bg-muted/50'
                          }`}
                        >
                          <h3 className="font-medium mb-2">Step {step.id}: {step.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tool: {step.action.type.replace('_', ' ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Enter a research query to generate a plan
                      </p>
                    )}
                  </TabsContent>
                  
                  {/* Results Tab */}
                  <TabsContent value="results" className="mt-4">
                    {artifacts.length > 0 ? (
                      <div className="space-y-4">
                        {artifacts.map((artifact, index) => (
                          <div key={index} className="p-4 border rounded-md">
                            <h3 className="font-medium mb-2">
                              {artifact.taskType === 'search' ? 'Search Results' : 
                               artifact.taskType === 'summarize' ? 'Summary' :
                               artifact.taskType}
                            </h3>
                            
                            {artifact.taskType === 'search' && (
                              <div className="space-y-3 mt-3">
                                {(artifact.artifact as ProcessedSearchResult[]).map((result, idx) => (
                                  <div key={idx} className="border-b pb-3 last:border-b-0">
                                    <a href={result.url} target="_blank" rel="noopener noreferrer" 
                                       className="font-medium hover:underline text-blue-600">
                                      {result.title}
                                    </a>
                                    <p className="text-sm text-muted-foreground">{result.source} • {result.date}</p>
                                    <p className="mt-1">{result.summary}</p>
                                    {result.keyPoints.length > 0 && (
                                      <ul className="mt-1 text-sm">
                                        {result.keyPoints.map((point, i) => (
                                          <li key={i} className="mt-1">• {point}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {artifact.taskType === 'summarize' && (
                              <p className="mt-2">{artifact.artifact as string}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Results will appear as research progresses
                      </p>
                    )}
                  </TabsContent>
                  
                  {/* Summary Tab */}
                  <TabsContent value="summary" className="mt-4">
                    {summary ? (
                      <div className="p-4 border rounded-md">
                        <h3 className="font-medium mb-2">Research Summary</h3>
                        <p>{summary}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Summary will appear after research is complete
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}