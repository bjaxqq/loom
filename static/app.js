const form = document.querySelector("#prompt-form")
const promptInput = document.querySelector("#prompt-input")
const clearButton = document.querySelector("#clear-button")
const generateButton = document.querySelector("#generate-button")
const copyJsonButton = document.querySelector("#copy-json-button")
const scenarioGrid = document.querySelector("#scenario-grid")

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

let lastBlueprint = null


function renderScenarios(scenarios) {
  scenarioGrid.innerHTML = ""

  scenarios.forEach((scenario) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "scenario-card secondary"
    button.innerHTML = `
      <strong>${scenario.title}</strong>
      <p>${scenario.prompt}</p>
    `

    button.addEventListener("click", () => {
      promptInput.value = scenario.prompt
      promptInput.focus()
    })

    scenarioGrid.appendChild(button)
  })
}


async function loadScenarios() {
  const response = await fetch("/api/scenarios")
  const payload = await response.json()

  renderScenarios(payload.items || [])
}


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
    kind.textContent = step.kind

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

  const topNodes = [
    {
      label: blueprint.flow_name,
      type: "standard",
    },
    {
      label: blueprint.trigger,
      type: "standard",
    },
  ]

  const nodes = [
    ...topNodes,
    ...blueprint.steps.map((step) => ({
      label: step.label,
      type: step.kind === "decision" ? "decision" : "standard",
    })),
  ]

  nodes.forEach((node, index) => {
    const nodeElement = document.createElement("div")
    nodeElement.className = `flow-node ${node.type === "decision" ? "decision" : ""}`.trim()

    const text = document.createElement("div")
    text.className = "flow-node-text"
    text.textContent = node.label

    nodeElement.appendChild(text)
    flowMap.appendChild(nodeElement)

    if (index < nodes.length - 1) {
      const connector = document.createElement("div")
      connector.className = "flow-connector"
      flowMap.appendChild(connector)
    }
  })
}


function renderBlueprint(blueprint) {
  lastBlueprint = blueprint

  flowName.textContent = blueprint.flow_name
  flowType.textContent = blueprint.flow_type
  primaryObject.textContent = blueprint.primary_object
  trigger.textContent = blueprint.trigger

  renderList(entryConditions, blueprint.entry_conditions)
  renderList(supportedPatterns, blueprint.supported_patterns)
  renderList(notesList, blueprint.notes)
  renderSteps(blueprint.steps)
  renderFlowMap(blueprint)

  jsonOutput.textContent = JSON.stringify(blueprint, null, 2)

  emptyState.classList.add("hidden")
  resultView.classList.remove("hidden")
}


async function generateBlueprint(prompt) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Request failed")
  }

  return payload
}


form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const prompt = promptInput.value.trim()

  if (!prompt) {
    promptInput.focus()
    return
  }

  generateButton.disabled = true
  generateButton.textContent = "Building..."

  try {
    const payload = await generateBlueprint(prompt)
    renderBlueprint(payload.blueprint)
  } catch (error) {
    window.alert(error.message || "Something went wrong")
  } finally {
    generateButton.disabled = false
    generateButton.textContent = "Build flow"
  }
})


clearButton.addEventListener("click", () => {
  promptInput.value = ""
  promptInput.focus()
})


copyJsonButton.addEventListener("click", async () => {
  if (!lastBlueprint) {
    return
  }

  await navigator.clipboard.writeText(JSON.stringify(lastBlueprint, null, 2))
  copyJsonButton.textContent = "Copied"

  setTimeout(() => {
    copyJsonButton.textContent = "Copy json"
  }, 1200)
})


loadScenarios().catch(() => {
  renderScenarios([])
})
