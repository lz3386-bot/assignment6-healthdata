import {useEffect, useRef} from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import {drag} from '../utils/drag';


export function Graph(props) {
        const { margin, svg_width, svg_height, data } = props;

        const nodes = getNodes({rawData: data});
        const links = getLinks({rawData: data});
    
        const width = svg_width - margin.left - margin.right;
        const height = svg_height - margin.top - margin.bottom;

        const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
        const radius = d3.scaleLinear().range([10, 50])
                .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map( d => d.name));
        
        const d3Selection = useRef();
        useEffect( ()=>{
            const simulation =  d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20/d.value))
                .force("charge", d3.forceManyBody())
                .force("centrer", d3.forceCenter(width/2, height/2))
                .force("y", d3.forceY([height/2]).strength(0.02))
                .force("collide", d3.forceCollide().radius(d => radius(d.value)+20))
                .tick(3000);
            
            let g = d3.select(d3Selection.current);
            g.selectAll("*").remove();
            const tooltip = d3.select("body")
    .selectAll(".node-tooltip")
    .data([null])
    .join("div")
    .attr("class", "node-tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("padding", "6px 10px")
    .style("font-size", "14px")
    .style("color", "black")
    .style("pointer-events", "none")
    .style("opacity", 0);
            const link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => lineWidth(d.value));

            const node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .enter();

            const point = node.append("circle")
    .attr("r", d => radius(d.value))
    .attr("fill", d => color(d.name))
    .call(drag(simulation))
    .on("mouseover", function(event, d) {
        tooltip
            .style("opacity", 1)
            .html(d.name);
    })
    .on("mousemove", function(event, d) {
        tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
        tooltip
            .style("opacity", 0);
    });

            const legend = g.append("g")
                .attr("class", "legend")
                .attr("transform", "translate(10, 10)");

            const legendItems = legend.selectAll(".legend-item")
                .data(nodes)
                .enter()
                .append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(0, ${i * 30})`);

            legendItems.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", d => color(d.name));

legendItems.append("text")
    .attr("x", 28)
    .attr("y", 14)
    .style("font-size", "14px")
    .style("fill", "black")
    .text(d => d.name);
            
            //const node_text = node.append('text')
                //.style("fill", "black")
                //.attr("stroke", "black")
                //.text(d => d.name)

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                point
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
                
                //node_text
                    //.attr("x", d => d.x -radius(d.value)/4)
                    //.attr("y", d => d.y)
            });

        }, [width, height])


        return <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
            > 
                <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
                </g>
            </svg>
    };