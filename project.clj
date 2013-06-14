(defproject foray-progress "0.1.0-SNAPSHOT"
  :description "Track progress through JoC for Foray book club"
  :url "http://github.com/rubysolo/foray-progress"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [domina "1.0.0"]]

  :plugins      [[lein-cljsbuild "0.3.2"]]
  :cljsbuild {
              :builds [{
                 :source-paths ["src/cljs"],
                 :compiler
                 {:pretty-print true,
                  :output-to "resources/public/foray-progress.js",
                  :optimization :whitespace}}]}
)
