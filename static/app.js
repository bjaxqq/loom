// ── Builder elements ──
const form = document.querySelector("#prompt-form")
const promptInput = document.querySelector("#prompt-input")
const clearButton = document.querySelector("#clear-button")
const generateButton = document.querySelector("#generate-button")
const copyJsonButton = document.querySelector("#copy-json-button")
const copyStepsButton = document.querySelector("#copy-steps-button")
const exportMdButton = document.querySelector("#export-md-button")
const scenarioGrid = document.querySelector("#scenario-grid")
const errorState = document.querySelector("#error-state")
const errorMessage = document.querySelector("#error-message")
const dismissErrorButton = document.querySelector("#dismiss-error-button")
const timerBadge = document.querySelector("#timer-badge")
const recentList = document.querySelector("#recent-list")
const recentEmpty = document.querySelector("#recent-empty")
const clearHistoryButton = document.querySelector("#clear-history-button")
const refineForm = document.querySelector("#refine-form")
const refineInput = document.querySelector("#refine-input")
const refineButton = document.querySelector("#refine-button")

const emptyState = document.querySelector("#empty-state")
const resultView = document.querySelector("#result-view")

const flowName = document.querySelector("#flow-name")
const flowType = document.querySelector("#flow-type")
const primaryObject = document.querySelector("#primary-object")
const trigger = document.querySelector("#trigger")
const entryConditions = document.querySelector("#entry-conditions")
const supportedPatterns = document.querySelector("#supported-patterns")
const stepsList = document.querySelector("#steps-list")
const notesList = document.querySelector("#notes-list")
const jsonOutput = document.querySelector("#json-output")
const flowMap = document.querySelector("#flow-map")

// ── Evaluate elements ──
const runAllButton = document.querySelector("#run-all-button")
const clearEvalButton = document.querySelector("#clear-eval-button")
const evalScenarioList = document.querySelector("#eval-scenario-list")
const evalResultsList = document.querySelector("#eval-results-list")
const evalEmptyState = document.querySelector("#eval-empty-state")
const builderResult = document.querySelector("#builder-result")
const evaluateResult = document.querySelector("#evaluate-result")

// ── Tab elements ──
const sidebar = document.querySelector(".sidebar")
const tabs = document.querySelectorAll(".tab")
const builderPanel = document.querySelector("#builder-panel")
const evaluatePanel = document.querySelector("#evaluate-panel")
const workspaceTitle = document.querySelector("#workspace-title")

let lastBlueprint = null
let evalScenarios = []
let evalRunning = false
let conversationHistory = []
let blueprintVersions = []
let currentVersionIndex = -1

const PATTERN_BADGE_CLASS = {
  "record creation triggers": "badge-green",
  "field updates": "badge-blue",
  "task creation": "badge-orange",
  "email alerts": "badge-purple",
  "decision branching": "badge-indigo",
}

const KIND_ICON = {
  decision: "◇",
  create_record: "⊕",
  update_record: "↻",
  create_task: "✓",
  send_email_alert: "✉",
}

const KIND_NODE_CLASS = {
  create_task: "node-task",
  send_email_alert: "node-email",
  update_record: "node-update",
  create_record: "node-create",
  decision: "node-decision",
}


// ── Tabs ──

function switchTab(target) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === target)
  })

  if (target === "builder") {
    builderPanel.classList.remove("hidden")
    evaluatePanel.classList.add("hidden")
    builderResult.classList.remove("hidden")
    evaluateResult.classList.add("hidden")
    workspaceTitle.textContent = "Flow Draft"
  } else {
    evaluatePanel.classList.remove("hidden")
    builderPanel.classList.add("hidden")
    evaluateResult.classList.remove("hidden")
    builderResult.classList.add("hidden")
    workspaceTitle.textContent = "Test Results"
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.target))
})


// ── Scenarios (builder) ──

function renderScenarios(scenarios) {
  scenarioGrid.innerHTML = ""

  scenarios.forEach((scenario) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "scenario-card secondary"
    button.innerHTML = `<strong>${scenario.title}</strong><p>${scenario.prompt}</p>`

    button.addEventListener("click", () => {
      promptInput.value = scenario.prompt
      promptInput.focus()
    })

    scenarioGrid.appendChild(button)
  })
}


// ── Evaluate scenario list ──

function renderEvalScenarios(scenarios) {
  evalScenarios = scenarios
  evalScenarioList.innerHTML = ""

  scenarios.forEach((scenario, index) => {
    const card = document.createElement("div")
    card.className = "eval-scenario-card"
    card.dataset.index = index
    card.innerHTML = `
      <div class="eval-status-dot" id="eval-dot-${index}"></div>
      <div class="eval-scenario-info">
        <strong>${scenario.title}</strong>
        <p>${scenario.prompt}</p>
      </div>
      <button type="button" class="secondary small eval-run-btn" data-index="${index}">Run</button>
    `

    card.querySelector(".eval-run-btn").addEventListener("click", () => runEvalScenario(index))
    evalScenarioList.appendChild(card)
  })
}

function setEvalStatus(index, status) {
  const dot = document.querySelector(`#eval-dot-${index}`)
  const card = evalScenarioList.children[index]

  if (!dot || !card) return

  dot.className = `eval-status-dot ${status}`
  card.className = `eval-scenario-card ${status}`
}


// ── Evaluate runner ──

async function runEvalScenario(index) {
  const scenario = evalScenarios[index]
  if (!scenario) return

  setEvalStatus(index, "running")

  try {
    const payload = await generateBlueprint(scenario.prompt)
    renderEvalResult(scenario.title, payload.blueprint, index)
    setEvalStatus(index, "passed")
  } catch (error) {
    renderEvalError(scenario.title, error.message, index)
    setEvalStatus(index, "failed")
  }
}

async function runAll() {
  if (evalRunning) return
  evalRunning = true

  runAllButton.disabled = true
  runAllButton.innerHTML = `<span class="spinner"></span> Running…`

  clearEvalResults()

  for (let i = 0; i < evalScenarios.length; i++) {
    await runEvalScenario(i)
    if (i < evalScenarios.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  runAllButton.disabled = false
  runAllButton.innerHTML = "Run all"
  evalRunning = false

  const dots = Array.from(evalScenarioList.querySelectorAll(".eval-status-dot"))
  const passed = dots.filter((d) => d.classList.contains("passed")).length
  const failed = dots.filter((d) => d.classList.contains("failed")).length
  const total = evalScenarios.length

  const existing = evalResultsList.querySelector(".eval-banner")
  if (existing) existing.remove()

  const banner = document.createElement("div")
  banner.className = `eval-banner${failed > 0 ? " has-errors" : ""}`
  banner.innerHTML = `
    <span class="eval-banner-icon">${failed === 0 ? "✓" : "⚠"}</span>
    ${passed}/${total} scenarios passed${failed > 0 ? ` · ${failed} failed` : ""}
  `
  evalResultsList.insertBefore(banner, evalResultsList.firstChild)
}

function clearEvalResults() {
  evalResultsList.innerHTML = ""
  evalEmptyState.classList.remove("hidden")
  evalScenarios.forEach((_, i) => {
    setEvalStatus(i, "")
    const btn = evalScenarioList.children[i]?.querySelector(".eval-run-btn")
    if (btn) { btn.disabled = false }
  })
}


// ── Evaluate result rendering ──

function renderEvalResult(title, blueprint, index) {
  evalEmptyState.classList.add("hidden")

  const block = document.createElement("div")
  block.className = "eval-result-block"
  block.style.animationDelay = `${index * 80}ms`

  const patternBadges = (blueprint.supported_patterns || [])
    .map((p) => `<span class="pattern-badge ${PATTERN_BADGE_CLASS[p] || ""}">${p}</span>`)
    .join("")

  const stepsHtml = (blueprint.steps || [])
    .map((s) => `<li><strong>${s.label}</strong> <span class="step-kind">${KIND_ICON[s.kind] || ""} ${s.kind}</span></li>`)
    .join("")

  block.innerHTML = `
    <div class="eval-result-header">
      <span class="eval-result-title">${title}</span>
      <div class="eval-result-badges">${patternBadges}</div>
      <span class="eval-toggle">▾</span>
    </div>
    <div class="eval-result-body">
      <div class="eval-summary-row">
        <div class="eval-summary-item">
          <span class="summary-label">Flow name</span>
          <strong>${blueprint.flow_name}</strong>
        </div>
        <div class="eval-summary-item">
          <span class="summary-label">Flow type</span>
          <strong>${blueprint.flow_type}</strong>
        </div>
        <div class="eval-summary-item">
          <span class="summary-label">Primary object</span>
          <strong>${blueprint.primary_object}</strong>
        </div>
        <div class="eval-summary-item">
          <span class="summary-label">Trigger</span>
          <strong>${blueprint.trigger}</strong>
        </div>
      </div>
      <ol class="eval-steps">${stepsHtml}</ol>
    </div>
  `

  block.querySelector(".eval-result-header").addEventListener("click", () => {
    block.classList.toggle("collapsed")
  })

  evalResultsList.appendChild(block)
}

function renderEvalError(title, message, index) {
  evalEmptyState.classList.add("hidden")

  const block = document.createElement("div")
  block.className = "eval-result-block error"
  block.style.animationDelay = `${index * 80}ms`

  block.innerHTML = `
    <div class="eval-result-header">
      <span class="eval-result-title">${title}</span>
      <span class="eval-toggle">▾</span>
    </div>
    <div class="eval-result-body">
      <div class="eval-error-banner">${message}</div>
    </div>
  `

  block.querySelector(".eval-result-header").addEventListener("click", () => {
    block.classList.toggle("collapsed")
  })

  evalResultsList.appendChild(block)
}


// ── Builder ──

function renderList(target, items) {
  target.innerHTML = ""
  items.forEach((item) => {
    const li = document.createElement("li")
    li.textContent = item
    target.appendChild(li)
  })
}

function renderSteps(steps) {
  stepsList.innerHTML = ""

  steps.forEach((step) => {
    const li = document.createElement("li")

    const title = document.createElement("strong")
    title.textContent = step.label

    const kind = document.createElement("span")
    kind.className = "step-kind"
    kind.textContent = `${KIND_ICON[step.kind] || ""} ${step.kind}`

    const detailList = document.createElement("ul")
    renderList(detailList, step.details)

    li.appendChild(title)
    li.appendChild(kind)
    li.appendChild(detailList)
    stepsList.appendChild(li)
  })
}

function renderFlowMap(blueprint) {
  flowMap.innerHTML = ""

  const nodes = [
    { label: blueprint.flow_name, kind: "trigger" },
    { label: blueprint.trigger, kind: "trigger" },
    ...blueprint.steps.map((step) => ({ label: step.label, kind: step.kind })),
  ]

  nodes.forEach((node, index) => {
    const nodeEl = document.createElement("div")
    const kindClass = KIND_NODE_CLASS[node.kind] || "node-trigger"
    nodeEl.className = `flow-node ${kindClass}${node.kind === "decision" ? " decision" : ""}`

    const text = document.createElement("div")
    text.className = "flow-node-text"
    text.textContent = node.label

    nodeEl.appendChild(text)
    flowMap.appendChild(nodeEl)

    if (index < nodes.length - 1) {
      const connector = document.createElement("div")
      connector.className = "flow-connector"
      flowMap.appendChild(connector)
    }
  })
}

function renderBlueprint(blueprint, prompt) {
  lastBlueprint = blueprint
  if (prompt !== undefined) lastPrompt = prompt

  flowName.textContent = blueprint.flow_name
  flowType.textContent = blueprint.flow_type
  primaryObject.textContent = blueprint.primary_object
  trigger.textContent = blueprint.trigger

  renderList(entryConditions, blueprint.entry_conditions)
  supportedPatterns.innerHTML = ""
  blueprint.supported_patterns.forEach((p) => {
    const li = document.createElement("li")
    const badge = document.createElement("span")
    badge.className = `pattern-badge ${PATTERN_BADGE_CLASS[p] || ""}`
    badge.textContent = p
    li.appendChild(badge)
    supportedPatterns.appendChild(li)
  })
  renderList(notesList, blueprint.notes)
  renderSteps(blueprint.steps)
  renderFlowMap(blueprint)

  jsonOutput.innerHTML = highlightJson(JSON.stringify(blueprint, null, 2))

  emptyState.classList.add("hidden")
  resultView.classList.remove("hidden")

  // re-trigger animation
  resultView.style.animation = "none"
  resultView.offsetHeight
  resultView.style.animation = ""
}

async function generateBlueprint(prompt, history = []) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, history }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Request failed")
  }

  return payload
}

function showError(message) {
  errorMessage.textContent = message
  errorState.classList.remove("hidden")
  emptyState.classList.add("hidden")
  resultView.classList.add("hidden")
}

function dismissError() {
  errorState.classList.add("hidden")
  if (!lastBlueprint) emptyState.classList.remove("hidden")
}

function blueprintToMarkdown(blueprint) {
  const lines = [
    `# ${blueprint.flow_name}`,
    ``,
    `**Flow type:** ${blueprint.flow_type}  `,
    `**Primary object:** ${blueprint.primary_object}  `,
    `**Trigger:** ${blueprint.trigger}`,
    ``,
    `## Entry rules`,
    ...blueprint.entry_conditions.map((c) => `- ${c}`),
    ``,
    `## Patterns used`,
    ...blueprint.supported_patterns.map((p) => `- ${p}`),
    ``,
    `## Steps`,
  ]

  blueprint.steps.forEach((step, i) => {
    lines.push(``, `### ${i + 1}. ${step.label} \`${step.kind}\``)
    step.details.forEach((d) => lines.push(`- ${d}`))
  })

  if (blueprint.notes.length > 0) {
    lines.push(``, `## Notes`)
    blueprint.notes.forEach((n) => lines.push(`- ${n}`))
  }

  return lines.join("\n")
}

form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const prompt = promptInput.value.trim()
  if (!prompt) {
    promptInput.focus()
    return
  }

  generateButton.disabled = true
  generateButton.innerHTML = `<span class="spinner"></span> Building…`
  errorState.classList.add("hidden")
  timerBadge.classList.add("hidden")
  resetConversation()
  blueprintVersions = []
  currentVersionIndex = -1
  startTimer()

  try {
    const payload = await generateBlueprint(prompt, [])
    renderBlueprint(payload.blueprint, prompt)
    addVersion(payload.blueprint)
    addConvoTurn("user", prompt)
    addConvoTurn("model", JSON.stringify(payload.blueprint))
    stopTimer()
    addToHistory(prompt, payload.blueprint.flow_name)
    pushUrlHash(prompt)
  } catch (error) {
    showError(error.message || "Something went wrong")
  } finally {
    generateButton.disabled = false
    generateButton.innerHTML = "Build flow"
  }
})

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    if (document.activeElement === promptInput || promptInput.value.trim()) {
      form.requestSubmit()
    }
  }
})

clearButton.addEventListener("click", () => {
  promptInput.value = ""
  promptInput.focus()
})

copyJsonButton.addEventListener("click", async () => {
  if (!lastBlueprint) return
  await navigator.clipboard.writeText(JSON.stringify(lastBlueprint, null, 2))
  copyJsonButton.textContent = "Copied!"
  setTimeout(() => { copyJsonButton.textContent = "Copy JSON" }, 1400)
})

exportMdButton.addEventListener("click", () => {
  if (!lastBlueprint) return
  const md = blueprintToMarkdown(lastBlueprint)
  const blob = new Blob([md], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${lastBlueprint.flow_name.replace(/\s+/g, "-").toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
})

dismissErrorButton.addEventListener("click", dismissError)

runAllButton.addEventListener("click", runAll)

clearEvalButton.addEventListener("click", () => {
  clearEvalResults()
})


// ── Demo / Production toggle ──

function applyMode(mode) {
  document.body.classList.toggle("demo-mode", mode === "demo")
  document.querySelectorAll(".mode-toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode)
  })
  if (mode === "production" && sidebar.dataset.tab === "evaluate") {
    switchTab("builder")
  }
  localStorage.setItem("loom-mode", mode)
}

document.querySelectorAll(".mode-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyMode(btn.dataset.mode))
})

document.querySelector("#trigger-error-button").addEventListener("click", () => {
  showError("Gemini API error 429: Rate limit exceeded — please wait a moment and try again.")
})

applyMode(localStorage.getItem("loom-mode") || "production")


// ── Versioning ──

const versionNav = document.querySelector("#version-nav")
const versionLabel = document.querySelector("#version-label")
const versionPrev = document.querySelector("#version-prev")
const versionNext = document.querySelector("#version-next")
const convoThread = document.querySelector("#convo-thread")
const convoList = document.querySelector("#convo-list")

function addVersion(blueprint) {
  blueprintVersions = blueprintVersions.slice(0, currentVersionIndex + 1)
  blueprintVersions.push(blueprint)
  currentVersionIndex = blueprintVersions.length - 1
  updateVersionNav()
}

function updateVersionNav() {
  const total = blueprintVersions.length
  if (total <= 1) {
    versionNav.classList.add("hidden")
    return
  }
  versionNav.classList.remove("hidden")
  versionLabel.textContent = `v${currentVersionIndex + 1} of ${total}`
  versionPrev.disabled = currentVersionIndex === 0
  versionNext.disabled = currentVersionIndex === total - 1
}

versionPrev.addEventListener("click", () => {
  if (currentVersionIndex > 0) {
    currentVersionIndex--
    renderBlueprint(blueprintVersions[currentVersionIndex])
    updateVersionNav()
  }
})

versionNext.addEventListener("click", () => {
  if (currentVersionIndex < blueprintVersions.length - 1) {
    currentVersionIndex++
    renderBlueprint(blueprintVersions[currentVersionIndex])
    updateVersionNav()
  }
})


// ── Conversation thread ──

function addConvoTurn(role, text) {
  conversationHistory.push({ role, content: text })

  const li = document.createElement("li")
  const roleSpan = document.createElement("span")
  roleSpan.className = `convo-role ${role}`
  roleSpan.textContent = role === "user" ? "You" : "Loom"

  li.appendChild(roleSpan)
  li.appendChild(document.createTextNode(
    role === "user" ? text : `Generated "${JSON.parse(text).flow_name}"`
  ))
  convoList.appendChild(li)

  if (conversationHistory.length > 1) {
    convoThread.classList.remove("hidden")
  }
}

function resetConversation() {
  conversationHistory = []
  convoList.innerHTML = ""
  convoThread.classList.add("hidden")
}


// ── Shareable URL ──

function pushUrlHash(prompt) {
  history.replaceState(null, "", "#" + encodeURIComponent(prompt))
}

function loadFromHash() {
  if (window.location.hash) {
    const decoded = decodeURIComponent(window.location.hash.slice(1))
    if (decoded) promptInput.value = decoded
  }
}


// ── Prompt history ──

const HISTORY_KEY = "loom-history"
const HISTORY_MAX = 8

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [] }
  catch { return [] }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

function addToHistory(prompt, flowName) {
  const items = loadHistory().filter((h) => h.prompt !== prompt)
  items.unshift({ prompt, flowName, ts: Date.now() })
  saveHistory(items.slice(0, HISTORY_MAX))
  renderHistory()
}

function renderHistory() {
  const items = loadHistory()
  recentList.innerHTML = ""
  recentEmpty.style.display = items.length ? "none" : ""

  items.forEach((item, index) => {
    const row = document.createElement("div")
    row.className = "recent-item"

    const text = document.createElement("span")
    text.className = "recent-item-text"
    text.textContent = item.prompt

    const flow = document.createElement("span")
    flow.className = "recent-item-flow"
    flow.textContent = item.flowName

    const remove = document.createElement("button")
    remove.className = "recent-remove secondary"
    remove.textContent = "✕"
    remove.title = "Remove"
    remove.addEventListener("click", (e) => {
      e.stopPropagation()
      const updated = loadHistory()
      updated.splice(index, 1)
      saveHistory(updated)
      renderHistory()
    })

    row.appendChild(text)
    row.appendChild(flow)
    row.appendChild(remove)
    row.addEventListener("click", () => {
      promptInput.value = item.prompt
      promptInput.focus()
    })

    recentList.appendChild(row)
  })
}

clearHistoryButton.addEventListener("click", () => {
  saveHistory([])
  renderHistory()
})


// ── Response timer ──

let generationStart = 0

function startTimer() { generationStart = Date.now() }

function stopTimer() {
  const elapsed = ((Date.now() - generationStart) / 1000).toFixed(1)
  timerBadge.textContent = `Generated in ${elapsed}s`
  timerBadge.classList.remove("hidden")
  // re-trigger animation
  timerBadge.style.animation = "none"
  timerBadge.offsetHeight
  timerBadge.style.animation = ""
}


// ── Refine ──

let lastPrompt = ""

refineForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const refinement = refineInput.value.trim()
  if (!refinement || !lastBlueprint) return

  refineButton.disabled = true
  refineButton.innerHTML = `<span class="spinner"></span>`

  const historySnapshot = [...conversationHistory]

  try {
    const payload = await generateBlueprint(refinement, historySnapshot)
    renderBlueprint(payload.blueprint, refinement)
    addVersion(payload.blueprint)
    addConvoTurn("user", refinement)
    addConvoTurn("model", JSON.stringify(payload.blueprint))
    refineInput.value = ""
  } catch (error) {
    showError(error.message || "Refinement failed")
  } finally {
    refineButton.disabled = false
    refineButton.innerHTML = "Refine"
  }
})


// ── Copy steps ──

copyStepsButton.addEventListener("click", async () => {
  if (!lastBlueprint) return
  const text = lastBlueprint.steps
    .map((s, i) => `${i + 1}. ${s.label} (${s.kind})\n${s.details.map((d) => `   - ${d}`).join("\n")}`)
    .join("\n\n")
  await navigator.clipboard.writeText(text)
  copyStepsButton.textContent = "Copied!"
  setTimeout(() => { copyStepsButton.textContent = "Copy steps" }, 1400)
})


// ── Mode pill ──

async function renderModePill() {
  try {
    const response = await fetch("/api/health")
    const payload = await response.json()
    const topbarActions = document.querySelector("#topbar-actions")
    const isLive = payload.mode === "live"
    const pill = document.createElement("div")
    pill.className = `mode-pill${isLive ? " live" : ""}`
    pill.innerHTML = `<span class="mode-dot"></span>${isLive ? "Live · gemini-2.5-flash" : "Mock mode"}`
    topbarActions.appendChild(pill)
    if (!payload.demo_enabled) {
      document.querySelector(".mode-toggle").style.display = "none"
      applyMode("production")
    }
  } catch {
    // silently skip
  }
}


// ── JSON syntax highlighting ──

function highlightJson(json) {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-num"
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-str"
      } else if (/true|false/.test(match)) {
        cls = "json-bool"
      } else if (/null/.test(match)) {
        cls = "json-null"
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}


// ── Init ──

async function init() {
  try {
    const response = await fetch("/api/scenarios")
    const payload = await response.json()
    const scenarios = payload.items || []

    renderScenarios(scenarios)
    renderEvalScenarios(scenarios)
  } catch {
    renderScenarios([])
    renderEvalScenarios([])
  }

  renderModePill()
  renderHistory()
  loadFromHash()
}

init()

