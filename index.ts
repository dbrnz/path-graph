//==============================================================================

import cytoscape from 'cytoscape'

//==============================================================================

const MAP_SERVER = 'https://mapcore-demo.org/devel/flatmap/v4'

//==============================================================================

async function loadKnowledge(pathUri: string): Promise<ConnectivityKnowledge>
{
    const url = `${MAP_SERVER}/knowledge/query/`

    const query = {
        sql: `select knowledge from knowledge where entity = '${pathUri}'`
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Accept": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(query)
    })
    if (!response.ok) {
        throw new Error(`Cannot access ${url}`)
    }
    const data = await response.json()
    return JSON.parse(data.values[0])
}

//==============================================================================

type KnowledgeNode = [string, string[]]

type KnowledgeEdge = [KnowledgeNode, KnowledgeNode]

interface ConnectivityKnowledge
{
    connectivity: KnowledgeEdge[]
    axons: KnowledgeNode[]
    dendrites: KnowledgeNode[]
}

//==============================================================================

type GraphNode = {
    id: string
    label: string
    axon?: boolean
    dendrite?: boolean
}

type GraphEdge = {
    id: string
    source: string
    target: string
}


//==============================================================================

class ConnectivityGraph
{
    #nodes: GraphNode[] = []
    #edges: GraphEdge[] = []
    #axons: string[]
    #dendrites: string[]

    constructor(knowledge: ConnectivityKnowledge)
    {
        this.#axons = knowledge.axons.map(node => JSON.stringify(node))
        this.#dendrites = knowledge.dendrites.map(node => JSON.stringify(node))
        for (const edge of knowledge.connectivity) {
            const e0 = this.#graphNode(edge[0])
            const e1 = this.#graphNode(edge[1])
            this.#nodes.push(e0)
            this.#nodes.push(e1)
            this.#edges.push({
                id: `${e0.id}_${e1.id}`,
                source: e0.id,
                target: e1.id
            })
        }
    }

    get elements()
    //============
    {
        return [
            ...this.#nodes.map(n => { return {data: n}}),
            ...this.#edges.map(e => { return {data: e}})
        ]
    }

    get roots(): string[]
    //===================
    {
        return this.#dendrites
    }

    #graphNode(node: KnowledgeNode): GraphNode
    //========================================
    {
        const id = JSON.stringify(node)
        const label = [node[0]]
        label.push(...node[1])
        const result = {
            id,
            label: label.join('\n')
        }
        if (this.#axons.includes(id)) {
            if (this.#dendrites.includes(id)) {
                result['both-a-d'] = true
            } else {
                result['axon'] = true
            }
        } else if (this.#dendrites.includes(id)) {
            result['dendrite'] = true

        }
        return result
    }
}

//==============================================================================

const GRAPH_STYLE = [
    {
        'selector': 'node',
        'style': {
            'label': 'data(label)',
            'background-color': '#80F0F0',
            'text-valign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '6px'
        }
    },
    {
        'selector': 'node[axon]',
        'style': {
            'background-color': 'green'
        }
    },
    {
        'selector': 'node[dendrite]',
        'style': {
            'background-color': 'red'
        }
    },
    {
        'selector': 'node[both-a-d]',
        'style': {
            'background-color': 'gray'
        }
    },
    {
        'selector': 'edge',
        'style': {
            'width': 2,
            'line-color': '#9dbaea',
            'target-arrow-color': '#9dbaea',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        }
    }
]


class CytoscapeGraph
{
    #cy
    #tooltip: HTMLElement

    constructor(graph: ConnectivityGraph)
    {
        const graphCanvas = document.getElementById('graph-canvas')

        this.#cy = cytoscape({
            container: graphCanvas,
            elements: connectivityGraph.elements,
            layout: {
                name: 'breadthfirst',
                circle: false,
                roots: connectivityGraph.roots
            },
            directed: true,
            style: GRAPH_STYLE
        }).on('mouseover', 'node', this.#overNode.bind(this))
          .on('mouseout', 'node', this.#exitNode.bind(this))
          .on('position', 'node', this.#moveNode.bind(this))

        this.#tooltip = document.createElement('div')
        this.#tooltip.id = 'tooltip'
        this.#tooltip.hidden = true
        graphCanvas.lastChild.appendChild(this.#tooltip)
    }

    #overNode(event)
    //==============
    {
        const node = event.target
        this.#tooltip.innerText = node.data().label
        this.#tooltip.style.left = `${event.renderedPosition.x}px`
        this.#tooltip.style.top = `${event.renderedPosition.y}px`
        this.#tooltip.hidden = false
    }

    #moveNode(event)
    //==============
    {
        const node = event.target
        this.#tooltip.style.left = `${node.renderedPosition().x}px`
        this.#tooltip.style.top = `${node.renderedPosition().y}px`
    }

    #exitNode(event)
    //==============
    {
        this.#tooltip.hidden = true
    }

}
//==============================================================================

const knowledge = await loadKnowledge('ilxtr:neuron-type-keast-9')

const connectivityGraph = new ConnectivityGraph(knowledge)

const cy = new CytoscapeGraph(connectivityGraph)

//==============================================================================
