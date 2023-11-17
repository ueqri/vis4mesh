# Instructions of Reproduction 

## Deploy Vis4Mesh

On any computer with python3 installed, its easy to deploy vis4mesh as a service.

1. Enter the directory `vis4mesh/dist`
2. Launch a http server with python
```shell
python3 -m http.server
```

Now vis4mesh is being served on default port 8000. It is able to open it in browser. 

## Start Visualization

Once opened, Vis4Mesh allow users to upload a data directory for visualization.

We support 2 sample datasets under `vis4mesh/visdata`. The datasets are compressed and in zip format. **Decompress them into normal directory before using.**

After decompressing, the provided dataset could be used in Vis4Mesh. Just click the button on the left top in Vis4Mesh main page, and choose to **upload the whole data directory**. For our provided datasets, upload either `conv2d-transfer-32x32` or `fir-100000-transfer` **directory**. Now the dataset is visualized in Vis4Mesh. And the figures used in paper come from the 2 datasets.