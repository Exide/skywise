resource "aws_s3_bucket" "skywise" {
  bucket = "skywise"
}

resource "aws_s3_bucket_website_configuration" "skywise" {
  bucket = aws_s3_bucket.skywise.id

  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_object" "dist" {
  for_each = fileset("../src/", "*")

  bucket = aws_s3_bucket.skywise.id
  key    = each.value
  source = "../src/${each.value}"
  etag   = filemd5("../src/${each.value}")
}
