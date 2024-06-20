<script lang="ts">
  import { onMount } from "svelte";

  import * as d3 from "d3";

  export let population: any[];

  let links: any[];
  let numberOfDigits = 2;
  const format = (population: any[]) => {
    let indices = population
      .map((_, i) => i)
      .sort((a, b) => population[a].score - population[b].score);
    population.forEach((_, i) => (population[indices[i]].scoreIndex = i));
    let levels =
      d3.max(population.map((p) => p.level)) -
      d3.min(population.map((p) => p.level));

    let x_scaling = Math.max(5, levels) / 1000;
    let y_scaling = Math.max(2, population.length - 1) / 300;
    population.forEach(
      (p) => (
        (p.x = p.level / x_scaling + 100), (p.y = p.scoreIndex / y_scaling + 50)
      )
    );
    links = population
      .filter((p) => p.parent !== null)
      .map((p) => ({ source: p.parent, target: p.id }));
    let smallestDifference = Math.min(
      ...population.map((p) =>
        Math.min(
          ...population.map(
            (q) =>
              Math.abs(p.score - q.score) +
              (Math.abs(p.score - q.score) < 1e-9 ? 1 : 0)
          )
        )
      )
    );
    numberOfDigits = Math.max(2, Math.ceil(Math.log10(1 / smallestDifference)));
  };
  $: format(population);

  const draw = (population: any[]) => {
    const popup = d3.select(".popup");
    const svg = d3.select("svg");
    d3.selectAll("svg > *").remove();
    popup.style("display", "none");

    // Create a path generator for the curved edges
    const linkGenerator = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBasis);

    // Draw edges
    svg
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", (d) => {
        const sourceNode = population.find((n) => n.id === d.source);
        const targetNode = population.find((n) => n.id === d.target);
        if (!sourceNode || !targetNode) return;
        return linkGenerator([
          { x: sourceNode.x, y: sourceNode.y },
          {
            x: (sourceNode.x + targetNode.x) / 2,
            y: (sourceNode.y + targetNode.y) / 2,
          },
          { x: targetNode.x, y: targetNode.y },
        ]);
      })
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Draw nodes
    svg
      .selectAll("circle")
      .data(population)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 10)
      .attr("class", "node");
    svg
      .selectAll("text")
      .data(population)
      .enter()
      .append("text")
      .attr("x", (d) => d.x + 15)
      .attr("y", (d) => d.y + 5)
      .attr("class", "label")
      .text((d) => d.score.toFixed(numberOfDigits));

    let popupVisible = false;
    let selectedNode: any = null;

    function positionPopup(event, d) {
      const svgRect = svg.node().getBoundingClientRect();
      const popupX = window.scrollX + svgRect.left + d.x + 15;
      const popupY = window.scrollY + svgRect.top + d.y;
      popup.style("left", popupX + "px").style("top", popupY + "px");
    }

    svg
      .selectAll("circle")
      .on("mouseover", function (event, d) {
        if (!popupVisible) {
          positionPopup(event, d);
          popup.style("display", "block");
          const safeText = d.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          popup.html(
            `Generation: ${d.level} <br>` +
              `Score: ${d.score.toFixed(numberOfDigits)} <br>` +
              `Prompt: <br>${safeText}`
          );
        }
      })
      .on("mouseout", function (event, d) {
        if (!popupVisible) {
          popup.style("display", "none");
        }
      })
      .on("mousedown", function (event, d) {
        event.stopPropagation();
        const getId = (d: any) => {
          return d._groups[0][0].__data__.id;
        };
        if (selectedNode) {
          selectedNode.classed("selected", false);
          popupVisible = false;
          popup.style("display", "none");
          if (getId(d3.select(this)) == getId(selectedNode)) {
            selectedNode = null;
            return;
          }
          selectedNode = null;
        }
        popupVisible = true;
        selectedNode = d3.select(this);
        selectedNode.classed("selected", true);
        positionPopup(event, d);
        popup.style("display", "block");
      });

    d3.select("body").on("mousedown", function () {
      if (selectedNode) {
        selectedNode.classed("selected", false);
        selectedNode = null;
      }
      if (popupVisible) {
        popupVisible = false;
        popup.style("display", "none");
      }
    });
    popup.on("mousedown", function (event) {
      event.stopPropagation();
    });
  };

  $: draw(population);
  onMount(() => {
    population = population;
  });
</script>

<main>
  <svg width="100%" height="400px"></svg>
  <div class="popup"></div>
</main>

<style>
  :global(.node) {
    fill: var(--secondary-color);
    stroke: #000;
    stroke-width: 1.5px;
  }
  :global(.node:hover) {
    fill: var(--tertiary-color);
  }
  :global(.node.selected) {
    fill: var(--tertiary-color);
  }

  :global(label) {
    font: 14px sans-serif;
  }

  .popup {
    position: absolute;
    background: #f9f9f9;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 3px;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
    display: none;
    width: fit-content;
    height: fit-content;
    font-size: 20px;
    max-width: 400px;
  }
</style>
