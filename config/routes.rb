# scope '(projects/:project_id)' do

#   get 'easy_gantt' => 'easy_gantt#index'
#   put 'relation/:id(.:format)' => 'easy_gantt#change_issue_relation_delay'

# #   resource :easy_gantt, controller: 'easy_gantt', only: [:index] do
# #     member do
# #       get 'issues'
# #       # get 'projects'
# #       put 'relation/:id(.:format)', to: 'easy_gantt#change_issue_relation_delay', as: 'relation'
# #     end
# #   end
# end

# scope 'easy_gantt', controller: 'easy_gantt', as: 'easy_gantt' do
#   scope format: true, defaults: { format: 'json' }, constraints: { format: 'json' } do
#     get 'projects'
#   end
# end


get '(projects/:project_id)/easy_gantt' => 'easy_gantt#index', as: 'easy_gantt'

scope format: true, defaults: { format: 'json' }, constraints: { format: 'json' } do
  scope 'projects/:project_id' do
    get 'easy_gantt/issues' => 'easy_gantt#issues', as: 'issues_easy_gantt'
    put 'easy_gantt/relation/:id' => 'easy_gantt#change_issue_relation_delay', as: 'relation_easy_gantt'
    get 'easy_gantt/project_issues' => 'easy_gantt#project_issues', as: 'project_issues_easy_gantt'
  end
  get 'easy_gantt/projects' => 'easy_gantt#projects', as: 'projects_easy_gantt'
end
