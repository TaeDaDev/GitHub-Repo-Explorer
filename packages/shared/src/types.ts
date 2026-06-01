// Shape returned by GET https://api.github.com/users/{username}/repos
export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  html_url: string
  language: string | null
  full_name: string
}

// Stored favorite row from our database
export interface Favorite {
  id: string
  userId: string
  githubRepoId: number
  name: string
  description: string | null
  stargazersCount: number
  htmlUrl: string
  language: string | null
  fullName: string
  createdAt: string
}

// Auth request bodies
export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Auth success response
export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
  }
}

// Generic success envelope
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Generic error shape - all backend errors use this
export interface ApiError {
  error: string
  statusCode: number
}
