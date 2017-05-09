require File.expand_path('../../../../easyproject/easy_plugins/easy_extensions/test/spec/spec_helper', __FILE__)

RSpec.feature 'Correct tree', logged: :admin, js: true do
  let(:project) {
    FactoryGirl.create(:project, add_modules: ['easy_gantt'], number_of_issues: 0)
  }
  let(:project_issues) {
    FactoryGirl.create_list(:issue, 3, :project_id => project.id)
  }
  let(:milestone) {
    FactoryGirl.create(:version, project_id: project.id)
  }
  let(:milestone_issues) {
    FactoryGirl.create_list(:issue, 3, :fixed_version_id => milestone.id, :project_id => project.id)
  }
  let(:sub_issues) {
    FactoryGirl.create_list(:issue, 3, :parent_issue_id => milestone_issues[0].id, :project_id => project.id)
  }
  let(:sub_sub_issues) {
    FactoryGirl.create_list(:issue, 3, :parent_issue_id => sub_issues[0].id, :project_id => project.id)
  }

  around(:each) do |example|
    with_settings(rest_api_enabled: 1) { example.run }
  end
  it 'should show project items in correct order' do
    sub_sub_issues
    project_issues
    project_issue = project_issues[0]
    visit easy_gantt_path(project)
    wait_for_ajax
    expect(page).to have_text(project_issue.subject)
    bars_area = page.find('.gantt_bars_area')
    order_list = [
      milestone_issues[0],
      sub_issues[0],
      sub_sub_issues[0], sub_sub_issues[1], sub_sub_issues[2],
      sub_issues[1], sub_issues[2],
      milestone_issues[1],
      milestone_issues[2],
      project_issues[0],
      project_issues[1],
      project_issues[2]
    ]
    prev = nil
    order_list.each do |issue|
      expect(bars_area).to have_text(issue.subject)
      unless prev.nil?
        expect(bars_area.find("div[task_id='#{prev.id}']+div[task_id='#{issue.id}']")).not_to be_nil
      end
      prev = issue
    end
  end
end