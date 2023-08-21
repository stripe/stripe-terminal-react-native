require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'stripe-terminal-react-native'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { ios: '11.0' }
  s.source       = { git: 'https://github.com/stripe/stripe-terminal-react-native.git', tag: s.version.to_s }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  s.dependency 'React-Core'
  s.dependency 'StripeTerminal', '2.23.1'
end
