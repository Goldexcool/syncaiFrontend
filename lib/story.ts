export type StorySceneId =
  | "arrival"
  | "capture"
  | "understand"
  | "knowledge"
  | "action"
  | "momentum"
  | "resolution";

export type PersonaId = "individual" | "student" | "freelancer" | "organization";

export type ConversationLine = {
  id: string;
  speaker: string;
  initials: string;
  time: string;
  text: string;
  tone: "neutral" | "decision" | "commitment";
};

export type Conversation = {
  id: string;
  title: string;
  projectName: string;
  date: string;
  duration: string;
  participants: string[];
  lines: ConversationLine[];
};

export type KnowledgeEntry = {
  id: string;
  title: string;
  body: string;
  sourceLineId: string;
  sourceLabel: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  owner: string;
  ownerInitials: string;
  due: string;
  sourceLineId: string;
  status: "open" | "complete";
};

export type Project = {
  id: string;
  name: string;
  client: string;
  description: string;
  progress: number;
  reviewDate: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  sourceLabel: string;
};

export type ProductState = {
  conversation: Conversation;
  knowledge: KnowledgeEntry[];
  tasks: Task[];
  project: Project;
  calendarEvent?: CalendarEvent;
};

export type StoryScene = {
  id: StorySceneId;
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  description: string;
  productState: ProductState;
};

export const conversation: Conversation = {
  id: "conversation-client-kickoff",
  title: "Client kickoff",
  projectName: "Northstar launch",
  date: "Today, 10:04 AM",
  duration: "34 min",
  participants: ["Maya Chen", "Sam Okafor", "Jordan Lee"],
  lines: [
    {
      id: "line-direction",
      speaker: "Jordan Lee",
      initials: "JL",
      time: "10:12",
      text: "Let’s keep the launch focused on the product story.",
      tone: "decision",
    },
    {
      id: "line-assets",
      speaker: "Maya Chen",
      initials: "MC",
      time: "10:19",
      text: "Maya will send the final brand assets today.",
      tone: "commitment",
    },
    {
      id: "line-draft",
      speaker: "Sam Okafor",
      initials: "SO",
      time: "10:27",
      text: "We’ll review the first draft on Thursday.",
      tone: "commitment",
    },
  ],
};

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: "knowledge-direction",
    title: "Northstar launch direction",
    body: "Keep the launch focused on the product story.",
    sourceLineId: "line-direction",
    sourceLabel: "From Client kickoff",
    createdAt: "Just now",
  },
];

export const initialTasks: Task[] = [
  {
    id: "task-assets",
    title: "Send final brand assets",
    owner: "Maya Chen",
    ownerInitials: "MC",
    due: "Today",
    sourceLineId: "line-assets",
    status: "open",
  },
  {
    id: "task-draft",
    title: "Prepare first launch draft",
    owner: "Sam Okafor",
    ownerInitials: "SO",
    due: "Friday",
    sourceLineId: "line-draft",
    status: "open",
  },
  {
    id: "task-review",
    title: "Review first draft",
    owner: "Jordan Lee",
    ownerInitials: "JL",
    due: "Thursday",
    sourceLineId: "line-draft",
    status: "open",
  },
];

export const project: Project = {
  id: "project-northstar",
  name: "Northstar launch",
  client: "Northstar",
  description: "A focused launch story for the next chapter.",
  progress: 0,
  reviewDate: "Thu, 14 Nov",
};

export const calendarEvent: CalendarEvent = {
  id: "calendar-northstar-review",
  title: "Northstar launch review",
  date: "Thursday, 14 Nov",
  time: "2:00 PM – 2:45 PM",
  sourceLabel: "From Client kickoff",
};

export const baseProductState: ProductState = {
  conversation,
  knowledge: knowledgeEntries,
  tasks: initialTasks,
  project,
  calendarEvent,
};

const cloneState = (): ProductState => ({
  conversation,
  knowledge: knowledgeEntries,
  tasks: initialTasks,
  project,
  calendarEvent,
});

export const storyScenes: StoryScene[] = [
  {
    id: "arrival",
    start: 0,
    end: 1 / 7,
    eyebrow: "01 / ARRIVE",
    title: "Work continues after the conversation ends.",
    description:
      "VOII gives the important parts of a conversation somewhere to go — so the next step is already waiting when the call is over.",
    productState: cloneState(),
  },
  {
    id: "capture",
    start: 1 / 7,
    end: 2 / 7,
    eyebrow: "02 / CAPTURE",
    title: "It starts with a conversation.",
    description:
      "The client kickoff is saved with its speakers, timestamps, and the exact words you may need to find later.",
    productState: cloneState(),
  },
  {
    id: "understand",
    start: 2 / 7,
    end: 3 / 7,
    eyebrow: "03 / UNDERSTAND",
    title: "What happened.",
    description:
      "VOII pulls the decision and commitments out of the transcript, so you can see what was agreed without replaying the call.",
    productState: cloneState(),
  },
  {
    id: "knowledge",
    start: 3 / 7,
    end: 4 / 7,
    eyebrow: "04 / KNOWLEDGE",
    title: "What matters.",
    description:
      "The decision becomes a searchable Knowledge entry, still linked to the conversation that produced it.",
    productState: cloneState(),
  },
  {
    id: "action",
    start: 4 / 7,
    end: 5 / 7,
    eyebrow: "05 / ACTION",
    title: "What comes next.",
    description:
      "VOII turns commitments into tasks with clear owners and due dates, so agreeing leads directly to doing.",
    productState: cloneState(),
  },
  {
    id: "momentum",
    start: 5 / 7,
    end: 6 / 7,
    eyebrow: "06 / MOMENTUM",
    title: "Everything stays connected.",
    description:
      "The conversation, Knowledge entry, tasks, project, and calendar event stay linked, so everyone can see what was decided and what moves next.",
    productState: cloneState(),
  },
  {
    id: "resolution",
    start: 6 / 7,
    end: 1,
    eyebrow: "07 / RESOLVE",
    title: "A little less to carry.",
    description:
      "Open the workspace and find the transcript, decision, owners, dates, and project progress in one place.",
    productState: cloneState(),
  },
];

type PersonaPayload = {
  type: "conversation" | "knowledge" | "task" | "project";
  label: string;
  title: string;
  detail: string;
  meta: string;
  initial: string;
};

export const personaCopy: Record<PersonaId, { label: string; support: string; emphasis: string; payload: PersonaPayload }> = {
  individual: {
    label: "Individual",
    support: "Record your calls, voice notes, and ideas, then find the important parts when you need them.",
    emphasis: "A quieter mind for the work that is yours.",
    payload: {
      type: "knowledge",
      label: "Knowledge",
      title: "Ideas worth returning to",
      detail: "One thread from thought to next move.",
      meta: "Connected to your work",
      initial: "K",
    },
  },
  student: {
    label: "Student",
    support: "Capture lectures, seminars, and group work, then search and revisit the ideas worth keeping.",
    emphasis: "Your notes become a way forward.",
    payload: {
      type: "conversation",
      label: "Conversation",
      title: "Seminar discussion",
      detail: "4 useful ideas kept after the room empties.",
      meta: "Source stays attached",
      initial: "C",
    },
  },
  freelancer: {
    label: "Freelancer",
    support: "Keep client decisions, deliverables, owners, and due dates together with the call they came from.",
    emphasis: "Every client promise stays visible.",
    payload: {
      type: "task",
      label: "Tasks from the call",
      title: "Northstar launch",
      detail: "3 promises with owners and dates.",
      meta: "Client kickoff attached",
      initial: "T",
    },
  },
  organization: {
    label: "Organization",
    support: "Give your team one searchable record of decisions, tasks, and project context instead of scattered notes.",
    emphasis: "The work moves as one.",
    payload: {
      type: "project",
      label: "Project",
      title: "Shared launch direction",
      detail: "One source everyone can return to.",
      meta: "Shared workspace",
      initial: "N",
    },
  },
};

export const sceneIndexForProgress = (progress: number): number => {
  const boundedProgress = Math.min(1, Math.max(0, progress));
  const index = storyScenes.findIndex((scene, sceneIndex) => {
    const isLast = sceneIndex === storyScenes.length - 1;
    return boundedProgress >= scene.start && (boundedProgress < scene.end || isLast);
  });

  return index === -1 ? storyScenes.length - 1 : index;
};
