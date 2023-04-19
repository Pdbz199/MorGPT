path_to_data = "./data"
data_file_name = "im evil.log"

count = 0

with open(f"{path_to_data}/{data_file_name}") as f:
    for line in f:
        count += 1

print(f"Number of lines = {count}")