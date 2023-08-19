#include <iostream>
#include <vector>

using namespace std;

void dfsRecursive(const vector<vector<int>> &adjList, int node, vector<bool> &visited)
{
    visited[node] = true;
    cout << node << " "; // Process the current node

    for (int neighbor : adjList[node])
    {
        if (!visited[neighbor])
        {
            dfsRecursive(adjList, neighbor, visited);
        }
    }
}

void dfs(const <vector<int>[] &adjList, int vertices, int startNode)
{
    vector<bool> visited(vertices, false);

    dfsRecursive(adjList, startNode, visited);
}