import { decryptVault } from "./vault";

export type Batch = {
  batch_id: string;
  batch_name: string;
  thumbnail: string;
  price?: string;
  description?: string;
};

export type Subject = {
  subjectid: string;
  subject_name: string;
  subject_logo?: string;
};

export type Topic = {
  topicid: string;
  topic_name: string;
  topic_logo?: string;
};

export type Lecture = {
  id: string;
  Title: string;
  material_type?: string;
  thumbnail?: string;
  startTime?: string;
  duration?: string;
  pdf_link?: string;
  [key: string]: unknown;
};

export type VideoDetails = {
  Title?: string;
  file_link?: string;
  pdf_link?: string;
  livestream_links?: { quality: string; path: string }[];
  download_links?: { quality: string; path: string }[];
  encrypted_links?: { quality: string; path: string; key?: string }[];
  [key: string]: unknown;
};

export type TestSeries = {
  id?: string;
  title?: string;
  name?: string;
  test_series_name?: string;
  thumbnail?: string;
  [key: string]: unknown;
};

async function vaultFetch<T>(endpoint: string): Promise<T | null> {
  const res = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { vaultData?: string; error?: string };
  if (!json?.vaultData) return null;
  const decoded = decryptVault<{ data?: T } | T>(json.vaultData);
  if (!decoded) return null;
  const maybe = decoded as { data?: T };
  return (maybe && typeof maybe === "object" && "data" in maybe
    ? maybe.data
    : (decoded as T)) as T;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") return Object.values(value) as T[];
  return [];
}

export async function getBatches(): Promise<Batch[]> {
  const data = await vaultFetch<unknown>("batches");
  return toArray<Batch>(data);
}

export async function getSubjects(courseId: string): Promise<Subject[]> {
  const data = await vaultFetch<unknown>(
    `get/allsubjectfrmlivecourseclass?courseid=${courseId}&start=-1`,
  );
  return toArray<Subject>(data);
}

export async function getTopics(
  courseId: string,
  subjectId: string,
): Promise<Topic[]> {
  const data = await vaultFetch<unknown>(
    `get/alltopicfrmlivecourseclass?courseid=${courseId}&subjectid=${subjectId}`,
  );
  return toArray<Topic>(data);
}

export async function getLectures(
  courseId: string,
  subjectId: string,
  topicId: string,
): Promise<Lecture[]> {
  const data = await vaultFetch<unknown>(
    `get/livecourseclassbycoursesubtopconceptapiv3?topicid=${topicId}&start=-1&conceptid=1&courseid=${courseId}&subjectid=${subjectId}`,
  );
  return toArray<Lecture>(data);
}

export async function getVideoDetails(
  courseId: string,
  videoId: string,
): Promise<VideoDetails | null> {
  return vaultFetch<VideoDetails>(
    `get/fetchVideoDetailsById?course_id=${courseId}&video_id=${videoId}&ytflag=0&folder_wise_course=0`,
  );
}

export async function getLiveClasses(courseId: string): Promise<Lecture[]> {
  const data = await vaultFetch<unknown>(
    `get/live_upcoming_course_classv2?courseid=${courseId}&start=-1`,
  );
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const live = toArray<Lecture>(obj["live"] ?? obj["upcoming"] ?? obj["data"]);
    if (live.length) return live;
  }
  return toArray<Lecture>(data);
}

export async function getAllTestSeries(): Promise<TestSeries[]> {
  const data = await vaultFetch<unknown>("get/test_series?start=-1&userid=0");
  return toArray<TestSeries>(data);
}

export async function getCourseTestSeries(
  courseId: string,
): Promise<TestSeries[]> {
  const data = await vaultFetch<unknown>(
    `get/test_seriesbycourseid?courseid=${courseId}&userid=11993934&folder_wise_course=0&start=-1`,
  );
  return toArray<TestSeries>(data);
}
