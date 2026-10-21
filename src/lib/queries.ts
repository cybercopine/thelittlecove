import { queryOptions } from "@tanstack/react-query";
import { getArchive, getHome, getPost, getSiteData, listPosts, getTag, getAllTags } from "./cove.functions";

export const siteQuery = queryOptions({ queryKey: ["site"], queryFn: () => getSiteData(), staleTime: 60_000 });
export const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHome() });
export const listQuery = (p: { category?: string; tag?: string; q?: string }) =>
  queryOptions({ queryKey: ["list", p], queryFn: () => listPosts({ data: p }) });
export const postQuery = (category: string, slug: string) =>
  queryOptions({ queryKey: ["post", category, slug], queryFn: () => getPost({ data: { category, slug } }) });
export const archiveQuery = queryOptions({ queryKey: ["archive"], queryFn: () => getArchive() });
export const tagQuery = (slug: string) => queryOptions({ queryKey: ["tag", slug], queryFn: () => getTag({ data: { slug } }) });
export const allTagsQuery = queryOptions({ queryKey: ["tags"], queryFn: () => getAllTags() });
