import constant from "./constant.js";
import jiggle from "./jiggle.js";
// import {ll} from "./utilssssss.js";

function index(d) {
    return d.index;
}


// export const l=console.log

export function ll(...args) {
    const lastArg = args[args.length - 1];
    // Check if last argument is true or an integer
    if (lastArg === true
    // || lastArg === 1
    ) {
        console.log(...args.slice(0, -1)); // Remove the last argument before logging
    }
    // If the condition is not met, do nothing
}


let log = true

function find(nodeById, nodeId) {
    var node = nodeById.get(nodeId);
    if (!node) throw new Error("node not found: " + nodeId);
    return node;
}

export default function (links) {
    var id = index,
        strength = defaultStrength,
        strengths,
        distance = constant(30),
        distances,
        nodes,
        nDim,
        count,
        bias,
        random,
        iterations = 1;

    if (links == null) links = [];

    function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }

    function force(alpha) {
        for (var k = 0,
                 n = links.length;
             k < iterations;
             ++k
        ) {
            for (var i = 0,
                     link,
                     source,
                     target,
                     x = 0,
                     y = 0,
                     z = 0,
                     l,
                     b;
                 i < n;
                 ++i
            ) {


                ll("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!links[i]", links[i],log)
                link = links[i],
                    source = link.source,
                    target = link.target;



                ll("!!!!!!!!source.vx Original", source.vx, "source.vy", source.vy, "source.vz", source.vz,log)
                ll("!!!!!!!!target.vx Original", target.vx, "target.vy", target.vy, "target.vz", target.vz,log)

                x = target.x + target.vx - source.x - source.vx || jiggle(random);
                if (nDim > 1) {
                    y = target.y + target.vy - source.y - source.vy || jiggle(random);
                }
                if (nDim > 2) {
                    z = target.z + target.vz - source.z - source.vz || jiggle(random);
                }
                l = Math.sqrt(x * x + y * y + z * z);
                ll("l", l)
                l = (l - distances[i]) / l * alpha * strengths[i];
                ll("l", l)
                x *= l, y *= l, z *= l;
                ll("bias[i]", bias[i], "x", x, "y", y, "z", z)
                target.vx -= x * (b = bias[i]);
                if (nDim > 1) {
                    target.vy -= y * b;
                }
                if (nDim > 2) {
                    target.vz -= z * b;
                }

                source.vx += x * (b = 1 - b);
                if (nDim > 1) {
                    source.vy += y * b;
                }
                if (nDim > 2) {
                    source.vz += z * b;
                }

                ll("!!!!!!!!source.vx", source.vx, "source.vy", source.vy, "source.vz", source.vz,log)
                ll("!!!!!!!!target.vx", target.vx, "target.vy", target.vy, "target.vz", target.vz,log)
            }
        }
    }

    function initialize() {
        if (!nodes) return;

        var i,
            n = nodes.length,
            m = links.length,
            nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
            link;

        for (i = 0, count = new Array(n); i < m; ++i) {
            link = links[i], link.index = i;
            if (typeof link.source !== "object") link.source = find(nodeById, link.source);
            if (typeof link.target !== "object") link.target = find(nodeById, link.target);
            count[link.source.index] = (count[link.source.index] || 0) + 1;
            count[link.target.index] = (count[link.target.index] || 0) + 1;
        }

        for (i = 0, bias = new Array(m);
             i < m;
             ++i) {
            link = links[i],
                bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }

        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
    }

    function initializeStrength() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
            strengths[i] = +strength(links[i], i, links);
        }
    }

    function initializeDistance() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
            distances[i] = +distance(links[i], i, links);
        }
    }

    force.initialize = function (_nodes, ...args) {
        nodes = _nodes;
        random = args.find(arg => typeof arg === 'function') || Math.random;
        nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
        initialize();
    };

    force.links = function (_) {
        return arguments.length ? (links = _, initialize(), force) : links;
    };

    force.id = function (_) {
        return arguments.length ? (id = _, force) : id;
    };

    force.iterations = function (_) {
        return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.strength = function (_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
    };

    force.distance = function (_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
    };

    return force;
}
