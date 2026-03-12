from roboflow import Roboflow
rf = Roboflow(api_key="NnUqnjSIxtqDS7CsIktV")
project = rf.workspace("goyam").project("potholes-kwv7g-rwgqi")
version = project.version(1)
dataset = version.download("yolov8")
                