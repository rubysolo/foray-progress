(defproject foray-progress "0.1.0-SNAPSHOT"

  :description "Track progress through JoC for Foray book club"
  :url "http://github.com/rubysolo/foray-progress"

  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/java.jdbc "0.2.3"]
                 [postgresql "9.1-901.jdbc4"]
                 [ring/ring-jetty-adapter "1.1.6"]
                 [compojure "1.1.3"]
                 [hiccup "1.0.2"]
                 [domina "1.0.0"]]

  :main      clj.foray-progress.core

  :plugins      [[lein-cljsbuild "0.3.2"]]

  :cljsbuild {
              :builds [{
                 :source-paths ["src/cljs"],
                 :compiler
                 {:pretty-print true,
                  :output-to "resources/public/foray-progress.js",
                  :optimization :whitespace}}]}
)
