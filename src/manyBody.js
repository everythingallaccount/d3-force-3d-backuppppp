import {binarytree} from "d3-binarytree";
import {quadtree} from "d3-quadtree";
import {octree} from "d3-octree";
import constant from "./constant.js";
import jiggle from "./jiggle.js";
import {x, y, z} from "./simulation.js";
import {l, ll} from "./utilssssss.js";

export default function () {
    var nodes,
        nDim,
        node,    // Temporary variable that refers to the current node.
        // This is mainly used in the function apply.
        random,
        alpha,
        strength = constant(-30),
        strengths,
        distanceMin2 = 1,
        distanceMax2 = Infinity,
        theta2 = 0.81;

    function force(_) {
        l("!!!!!!!!force(_)!!!!!!!!");
        l("!!!!!!!!force(_)!!!!!!!! Now attempting to build a new tree with the nodes:", nodes,
            "Right after the tree is built we accumulate the forces Downside up. "
        );

        var i,
            n = nodes.length,
            tree =
                (nDim === 1 ? binarytree(nodes, x)
                        : (nDim === 2 ? quadtree(nodes, x, y)
                                : (nDim === 3 ?
                                        octree(nodes, x, y, z)
                                        : null
                                )
                        )
                )
        l("!!!!!!!!force(_)!!!!!!!!  tree._x0:", tree._x0, "tree._y0:", tree._y0, "tree._z0:", tree._z0,
            "tree._x1:", tree._x1, "tree._y1:", tree._y1, "tree._z1:", tree._z1);

        tree.visitAfter(accumulate);
        l("!!!!!!!!force(_)!!!!!!!!  tree:", tree);
        l("!!!!!!!!force(_)!!!!!!!!  tree.root:", tree._root);
        for (alpha = _, i = 0; i < n; ++i)
            node = nodes[i],
                tree.visit(apply);// We visit the tree against this node.
        l("!!!!!!!!force(_)!!!!!!!!  nodes:", nodes);
    }

    function initialize() {
        if (!nodes) return;
        var i,
            n = nodes.length,
            node;
        strengths = new Array(n);
        for (i = 0; i < n; ++i) {
            node = nodes[i],
                strengths[node.index] = +strength(node, i, nodes);
                l("!!!!!!!!initialize strengths[node.index]:", strengths[node.index]);
        }
    }

    function accumulate(treeNode) {
        var strength = 0,
            q,
            c,
            weight = 0,
            x,
            y,
            z,
            i;

        var numChildren = treeNode.length;



        l("!!!!!!!!accumulate treeNode--------------------------------7:", treeNode);
        l("!!!!!!!!accumulate numChildren:!!!!!!!!", numChildren);
        // This function is meant to be called bottom up approach in the whole tree,
        // so the else part will be executed first.
        // Because this callback will be executed on the leaf nodes first.
        if (numChildren) {


            for (x = y = z = i = 0;
                 i < numChildren;
                 ++i
            ) {

                if (
                    (q = treeNode[i]) &&
                    (c = Math.abs(q.value))
                ) {

                    strength += q.value,
                        weight += c,
                        x += c * (q.x || 0),
                        y += c * (q.y || 0),
                        z += c * (q.z || 0);
                }else{
                    //
                }
            }
            strength *= Math.sqrt(4 / numChildren); // scale accumulated strength according to number of dimensions
            l("!!!!!!!!accumulate strength After multiplied by square root. ", strength);
            treeNode.x = x / weight;
            if (nDim > 1) {
                treeNode.y = y / weight;
            }
            if (nDim > 2) {
                treeNode.z = z / weight;
            }

            l("!!!!!!!!accumulate treeNode:" +
                "(This mainly calculate the average value of the X and Y of all the Data points in a node. ",
                treeNode
            );
        }

        // For leaf nodes, accumulate forces from coincident nodes.
        else {
            q = treeNode;
            q.x = q.data.x;
            if (nDim > 1) {
                q.y = q.data.y;
            }
            if (nDim > 2) {
                q.z = q.data.z;
            }
            do strength += strengths[q.data.index];  // Minus 30 for all the node.
            while (q = q.next);       // q.next is the next node in the same Position
        }
        l("!!!!!!!!accumulate strength:", strength);
        treeNode.value = strength;
    }

    function apply(treeNode, x1, arg1, arg2, arg3) {
        if (!treeNode.value) return true;
        var x2 = [arg1, arg2, arg3][nDim - 1];

        var x = treeNode.x - node.x,
            y = (nDim > 1 ? treeNode.y - node.y : 0),
            z = (nDim > 2 ? treeNode.z - node.z : 0),
            w = x2 - x1,
            l = x * x + y * y + z * z;

        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        ll("!!!!!!!!w * w / theta2:", w * w / theta2, "l:", l);
        if (w * w / theta2 < l
            // The distance between the Data and the Center of the bound of the tree node
            // is greater than
            // the Extend of the bound

        ) {
            if (l < distanceMax2) {
                ll("!!!!!!!!l<distanceMax2", l, "distanceMax2", distanceMax2);
                if (x === 0)
                    x = jiggle(random),
                        l += x * x;
                if (nDim > 1 && y === 0) y = jiggle(random), l += y * y;
                if (nDim > 2 && z === 0) z = jiggle(random), l += z * z;


                if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);


                node.vx += x * treeNode.value * alpha / l;
                if (nDim > 1) {
                    node.vy += y * treeNode.value * alpha / l;
                }
                if (nDim > 2) {
                    node.vz += z * treeNode.value * alpha / l;
                }

            } else {

                //This node is too far away. We don't even care about.
            }
            return true;
            // Remember, if we return true, the visit function will not visit the children of this node.
        }


        // The data is not very far away in terms of the extent of the bound of the current node.


        // Otherwise, process points directly.
        else if (
            treeNode.length           // This is a internal node
            ||
            l >= distanceMax2         // The Data is very far away
        ) {
            return; // This is a internal node, we need to visit the children.
        }


        // For the function to reach here, it has to be a leaf node



        // Limit forces for very close nodes; randomize direction if coincident.
        if (treeNode.data !== node
            ||
            treeNode.next
        ) {
            l("!!!!!!!!233treeNode.data !== node", treeNode.data !== node, "treeNode.next", treeNode.next);
            if (x === 0) x = jiggle(random), l += x * x;
            if (nDim > 1 && y === 0) y = jiggle(random), l += y * y;
            if (nDim > 2 && z === 0) z = jiggle(random), l += z * z;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }

        do if (
            treeNode.data !== node
        ) {

            w = strengths[treeNode.data.index] * alpha / l;
            node.vx += x * w;
            if (nDim > 1) {
                node.vy += y * w;
            }
            if (nDim > 2) {
                node.vz += z * w;
            }
        } while (treeNode = treeNode.next);
    }

    force.initialize = function (_nodes, ...args) {
        nodes = _nodes;
        random = args.find(arg => typeof arg === 'function') || Math.random;
        nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
        initialize();
    };

    force.strength = function (_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
    };

    force.distanceMin = function (_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
    };

    force.distanceMax = function (_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
    };

    force.theta = function (_) {
        return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
    };

    return force;
}
