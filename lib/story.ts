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
  progress: 68,
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
      "A client kickoff arrives as it happened: people, timing, and the words that will matter later.",
    productState: cloneState(),
  },
  {
    id: "understand",
    start: 2 / 7,
    end: 3 / 7,
    eyebrow: "03 / UNDERSTAND",
    title: "What happened.",
    description:
      "VOII brings the decision and commitments forward without asking you to search through a wall of transcript.",
    productState: cloneState(),
  },
  {
    id: "knowledge",
    start: 3 / 7,
    end: 4 / 7,
    eyebrow: "04 / KNOWLEDGE",
    title: "What matters.",
    description:
      "The direction becomes durable knowledge, still connected to the conversation that gave it meaning.",
    productState: cloneState(),
  },
  {
    id: "action",
    start: 4 / 7,
    end: 5 / 7,
    eyebrow: "05 / ACTION",
    title: "What comes next.",
    description:
      "Commitments become clear owners and next steps. Nothing gets lost between agreeing and doing.",
    productState: cloneState(),
  },
  {
    id: "momentum",
    start: 5 / 7,
    end: 6 / 7,
    eyebrow: "06 / MOMENTUM",
    title: "Everything stays connected.",
    description:
      "The conversation, knowledge, tasks, project, and calendar keep one shared thread — from what was said to what moves next.",
    productState: cloneState(),
  },
  {
    id: "resolution",
    start: 6 / 7,
    end: 1,
    eyebrow: "07 / RESOLVE",
    title: "A little less to carry.",
    description:
      "Not another place to check. A calmer way to keep the work moving.",
    productState: cloneState(),
  },
];

export const personaCopy: Record<PersonaId, { label: string; support: string; emphasis: string }> = {
  individual: {
    label: "Individual",
    support: "Keep your thinking, decisions, and next moves close at hand.",
    emphasis: "A quieter mind for the work that is yours.",
  },
  student: {
    label: "Student",
    support: "Turn seminars, group work, and ideas into something you can return to.",
    emphasis: "Your notes become a way forward.",
  },
  freelancer: {
    label: "Freelancer",
    support: "Keep every client promise visible without making your process feel heavy.",
    emphasis: "Make space for the work only you can do.",
  },
  organization: {
    label: "Organization",
    support: "Give every team conversation a useful afterlife — with the context intact.",
    emphasis: "The work moves as one.",
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
