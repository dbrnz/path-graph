Connectivity Graph Viewer
=========================

A `Cytoscape.js <https://js.cytoscape.org/>`_ viewer for neuron connectivity graphs.


Usage
-----

See the bottom of ``index.ts``::

    const knowledge = await loadKnowledge('ilxtr:neuron-type-keast-9')
    const connectivityGraph = new ConnectivityGraph(knowledge)
    const cy = new CytoscapeGraph(connectivityGraph)


Suggested enhancements
----------------------

*   Use human-readable labels for terms.
*   Provide a callback function and a ``click`` handler to allow a calling
    application to highlight features that correspond to graph nodes.
