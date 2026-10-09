import { PageLoader } from "@/components/global/RouteLoading"

/**
 * The month's guidance while it is fetched.
 *
 * <p>In the `(list)` group rather than in `guidance/` itself so it does not
 * also wrap `guidance/[contentId]`. Nested that way, opening a piece from the
 * list would keep the list's boundary resolved and show no loader at all,
 * while the article's own boundary waited underneath it.
 */
export default function GuidanceLoading() {
  return <PageLoader />
}
