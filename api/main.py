from fastapi import FastAPI

app = FastAPI(root_path="/v0")

@app.get("/test")
def test():
    return "`test`"
