import json
import random
from numpy import select
import seaborn as sns

total_node = 0


def color_by_value(value):
    if value > 10 or value < 0:
        raise ValueError
    diverging_colors = sns.color_palette("RdBu", 10)
    # print(diverging_colors.as_hex())
    return diverging_colors.as_hex()[-int(value)-1]


class node:
    def __init__(self, id, total):
        self.id = id
        self.weight = total-id

    def dump(self):
        return {
            "id": str(self.id),
            "weight": self.weight,
            "label": "Switch{}".format(self.id),
        }


class edge:
    def __init__(self, link, val=0):
        self.link = link
        self.val = val

    def set_value(self, val):
        if val < 0 or val > 9:
            raise ValueError
        self.val = val

    def dump(self):
        return {
            "source": str(self.link[0]),
            "target": str(self.link[1]),
            "type": "custom-edge",
            "value": self.val,
            "style": {
                "stroke": str(color_by_value(self.val))
            }
        }


class mesh:
    def __init__(self, rows, cols):
        self.data = {
            "nodes": [],
            "edges": [],
        }
        self.total = rows*cols
        self.r, self.c = rows, cols

        self.edge_pool = []
        for i in range(rows):
            for j in range(cols):
                id = i*cols+j
                self.edge_pool += self.get_link_by_node(id)

        self.__generate_nodes()

    def get_link_by_node(self, idx):
        edges = []
        if idx < 0 or idx >= self.r*self.c:
            return edges

        # North Link
        if idx-self.c >= 0:
            edges.append(edge([idx-self.c, idx]))
        # Source Link
        if idx+self.c < self.r*self.c:
            edges.append(edge([idx, idx+self.c]))
        # East Link
        if idx % self.c != 0:
            edges.append(edge([idx-1, idx]))
        # West Link
        if (idx+1) % self.c != 0:
            edges.append(edge([idx, idx+1]))

        return edges

    def __generate_nodes(self):
        for idx in range(self.total):
            self.data["nodes"].append(node(idx, self.total).dump())

    def random_edges(self, num):
        for idx in random.sample(range(len(self.edge_pool)), num):
            val = random.randint(0, 9)
            self.edge_pool[idx].set_value(val)

        self.data["edges"] = [item.dump() for item in self.edge_pool]

    def dump(self):
        return self.data


if __name__ == '__main__':
    m = mesh(8, 8)
    m.random_edges(200)
    with open('src/content.json', 'w') as f:
        f.write(json.dumps(m.dump(), indent=4))
