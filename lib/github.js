const GITHUB_API_BASE = 'https://api.github.com'

function getGitHubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ResumeMax-Portfolio-Analyzer',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function fetchGitHubJson(path) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: getGitHubHeaders(),
    next: { revalidate: 0 },
  })

  if (response.status === 404) {
    throw new Error('GitHub user not found')
  }

  if (response.status === 403) {
    throw new Error('GitHub API rate limit reached')
  }

  if (!response.ok) {
    throw new Error('GitHub API error')
  }

  return response.json()
}

async function hasReadme(owner, repo) {
  try {
    const response = await fetchGitHubJson(`/repos/${owner}/${repo}/readme`)
    return Boolean(response?.name)
  } catch (error) {
    if (error.message === 'GitHub user not found') {
      return false
    }
    return false
  }
}

export async function getGitHubProfile(username) {
  const data = await fetchGitHubJson(`/users/${username}`)

  return {
    login: data.login,
    name: data.name,
    bio: data.bio,
    location: data.location,
    blog: data.blog,
    public_repos: data.public_repos,
    followers: data.followers,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
  }
}

export async function getPinnedRepos(username) {
  const repos = await fetchGitHubJson(`/users/${username}/repos?sort=updated&per_page=6`)

  return Promise.all(
    repos.map(async (repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics ?? [],
      has_readme: await hasReadme(repo.owner.login, repo.name),
      homepage: repo.homepage,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
    }))
  )
}

export async function getLanguages(username) {
  const repos = await fetchGitHubJson(`/users/${username}/repos?sort=updated&per_page=10`)
  const languageCounts = {}

  await Promise.all(
    repos.slice(0, 5).map(async (repo) => {
      const languages = await fetchGitHubJson(
        `/repos/${repo.owner.login}/${repo.name}/languages`
      )

      for (const [language, bytes] of Object.entries(languages)) {
        languageCounts[language] = (languageCounts[language] || 0) + bytes
      }
    })
  )

  return Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language]) => language)
}

export async function scrapePortfolio(url) {
  if (!url) return null

  const normalizedUrl = normalizePortfolioUrl(url)
  if (!normalizedUrl) return null

  try {
    const response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'ResumeMax-Portfolio-Analyzer',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) return null

    const html = await response.text()
    const { load } = await import('cheerio')
    const $ = load(html)
    const bodyText = $('body').text()

    return {
      title: $('title').text().trim(),
      has_projects_section: bodyText.toLowerCase().includes('project'),
      has_contact:
        $('a[href^="mailto:"]').length > 0 ||
        bodyText.toLowerCase().includes('contact'),
      has_about: bodyText.toLowerCase().includes('about'),
      links: $('a[href]')
        .map((_, element) => $(element).attr('href'))
        .get()
        .filter(Boolean)
        .slice(0, 20),
      tech_mentioned: extractTechKeywords(bodyText),
    }
  } catch {
    return null
  }
}

function normalizePortfolioUrl(url) {
  if (typeof url !== 'string' || url.trim().length === 0) return null

  const trimmed = url.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).toString()
  } catch {
    return null
  }
}

function extractTechKeywords(text) {
  const keywords = [
    'React',
    'Next.js',
    'Vue',
    'Angular',
    'Node',
    'Express',
    'Python',
    'Django',
    'FastAPI',
    'TypeScript',
    'JavaScript',
    'Supabase',
    'Firebase',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'AWS',
    'Vercel',
    'Docker',
    'GraphQL',
    'Tailwind',
  ]

  const lowerText = text.toLowerCase()

  return keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()))
}
