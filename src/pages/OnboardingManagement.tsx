import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingStageManagement } from "@/components/OnboardingStageManagement";
import { OnboardingTaskManagement } from "@/components/OnboardingTaskManagement";
import { EmployeeOnboardingExecution } from "@/components/EmployeeOnboardingExecution";

export default function OnboardingManagement() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Employee Onboarding Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage the GSG program stages, tasks, and execute onboarding plans
        </p>
      </div>

      <Tabs defaultValue="execution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="execution">Execute Onboarding</TabsTrigger>
          <TabsTrigger value="stages">Manage Stages</TabsTrigger>
          <TabsTrigger value="tasks">Manage Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="execution">
          <EmployeeOnboardingExecution />
        </TabsContent>

        <TabsContent value="stages">
          <OnboardingStageManagement />
        </TabsContent>

        <TabsContent value="tasks">
          <OnboardingTaskManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
