export async function analyzeResume(file, jobDescription, token) {
  const formData = new FormData()
  formData.append('resume', file)
  formData.append('jobDescription', jobDescription)

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw err
  }
  return res.json()
}

export async function getUsage(token) {
  const res = await fetch('/api/usage', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function analyzePortfolio(
  github_username, portfolio_url, target_role, token
) {
  const res = await fetch('/api/portfolio/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      github_username,
      portfolio_url,
      target_role,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw err
  }
  return res.json()
}
