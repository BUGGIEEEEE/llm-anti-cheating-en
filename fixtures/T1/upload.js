function handleUpload(file) {
  const ext = file.name.split(".").pop();
  const allowed = ["jpg", "png", "gif"];
  if (allowed.includes(ext)) {
    saveFile("/uploads/" + file.name, file.data);
  }
}
