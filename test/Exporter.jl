module Exporter

export exported_a, exported_b, exported_c, x, exported_d

exported_a() = "hi"
exported_b() = "hi-b"
exported_c() = "hi-c"
exported_d() = "hi-d"

un_exported() = "bye"

x = 2

end # Exporter

# a duplicate
module Exporter2
using ..Exporter

# re-export the same name
export exported_a

end # Exporter

# a clash
module Exporter3

export exported_b

exported_b() = "hi-b-clash"

end # Exporter
