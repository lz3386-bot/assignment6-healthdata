// import React from "react";
import React from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2, format } from "d3";

function getLeafColorKey(d) {
    // 用 leaf 的 parent 上色，也就是 expected output 里的 gender 层
    if (d.parent && d.parent.depth >= 2) {
        return d.parent.data.name;
    }
    return d.data.name;
}

function getLabelLines(d) {
    return d
        .ancestors()
        .reverse()
        .filter(node => node.depth > 0)
        .map(node => `${node.data.attr}: ${node.data.name}`)
        .concat([`Value: ${format(",")(d.value)}`]);
}


function wrapText(line, maxChars) {
    if (line.length <= maxChars) return [line];

    const parts = [];
    let start = 0;

    while (start < line.length) {
        parts.push(line.slice(start, start + maxChars));
        start += maxChars;
    }

    return parts;
}

function Text({ d, clipId }) {
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;

    if (width < 8 || height < 8) return null;

    const fontSize = width < 35 ? 8 : 11;
    const lineHeight = fontSize + 3;

    const maxChars = Math.max(3, Math.floor(width / (fontSize * 0.62)));

    const rawLines = getLabelLines(d);
    const wrappedLines = rawLines.flatMap(line => wrapText(line, maxChars));

    const maxLines = Math.max(1, Math.floor((height - 6) / lineHeight));

    return (
        <text
            x={d.x0 + 4}
            y={d.y0 + fontSize + 3}
            fontSize={fontSize}
            fill="white"
            pointerEvents="none"
            clipPath={`url(#${clipId})`}
        >
            {wrappedLines.slice(0, maxLines).map((line, i) => (
                <tspan key={i} x={d.x0 + 4} dy={i === 0 ? 0 : lineHeight}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;

    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;

    const root = hierarchy(tree)
        .sum(d => d.children ? 0 : d.value)

    treemap()
        .size([innerWidth, innerHeight])
        .paddingInner(3)
        .paddingOuter(3)
        .round(true)(root);

    const leaves = root.leaves();
    const firstLevelNodes = root.children || [];

    const color = scaleOrdinal(schemeDark2);

    return (
        <svg
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g transform={`translate(${margin.left}, ${margin.top})`}>

                {/* 先画最底层 rectangles */}
                {leaves.map((d, i) => (
                    <g
                        key={`leaf-${i}`}
                        onClick={() => setSelectedCell(d)}
                        style={{ cursor: "pointer" }}
                    >
                        <rect
                            x={d.x0}
                            y={d.y0}
                            width={d.x1 - d.x0}
                            height={d.y1 - d.y0}
                            fill={color(getLeafColorKey(d))}
                            stroke={selectedCell === d ? "black" : "white"}
                            strokeWidth={selectedCell === d ? 4 : 2}
                        />
                        <clipPath id={`clip-${i}`}>
    <rect
        x={d.x0}
        y={d.y0}
        width={d.x1 - d.x0}
        height={d.y1 - d.y0}
    />
</clipPath>

<Text d={d} clipId={`clip-${i}`} />
                    </g>
                ))}

                {/* 再画 heart_disease: 0 / 1 的大边框 */}
                {firstLevelNodes.map((d, i) => (
                    <rect
                        key={`group-border-${i}`}
                        x={d.x0}
                        y={d.y0}
                        width={d.x1 - d.x0}
                        height={d.y1 - d.y0}
                        fill="none"
                        stroke="black"
                        strokeWidth={1}
                    />
                ))}

                {/* 最后加 heart_disease: 0 / 1 的大标签 */}
                {firstLevelNodes.map((d, i) => {
                    const width = d.x1 - d.x0;
                    const height = d.y1 - d.y0;
                    const cx = (d.x0 + d.x1) / 2;
                    const cy = (d.y0 + d.y1) / 2;

                    return (
                        <text
                            key={`big-label-${i}`}
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={width < height ? 30 : 34}
                            fontWeight="bold"
                            fill="black"
                            opacity={0.28}
                            pointerEvents="none"
                            transform={
                                width < height
                                    ? `rotate(90, ${cx}, ${cy})`
                                    : undefined
                            }
                        >
                            {`${d.data.attr}: ${d.data.name}`}
                        </text>
                    );
                })}
            </g>
        </svg>
    );
}