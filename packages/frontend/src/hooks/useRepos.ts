import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { GitHubRepo } from '@github-explorer/shared'

const fetchRepos = async (username: string): Promise<GitHubRepo[]> => {
  const res = await axios.get<GitHubRepo[]>(
    `https://api.github.com/users/${username}/repos`,
    { params: { sort: 'updated', per_page: 30 } }
  )
  return res.data
}

export const useRepos = (username: string) =>
  useQuery({
    queryKey: ['repos', username],
    queryFn: () => fetchRepos(username),
    enabled: !!username,
    retry: false,
    staleTime: 5 * 60 * 1000
  })
