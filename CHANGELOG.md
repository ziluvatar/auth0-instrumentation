# Changelog

## v2.7.0

FEATURES:
* Underlying kinesis lib performs retries on failed calls.

## v2.6.0

FEATURES:
* Added Profiler which allows to take heap dumps on demand and produces GC metrics.

NOTES:
* If you already have a `profiler` in your service, you should remove it to avoid having duplicates.
